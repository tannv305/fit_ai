package com.shop.service;

import com.shop.dto.response.ProductDetailInfoDto;
import com.shop.entity.Product;
import com.shop.entity.ProductImage;
import com.shop.entity.ProductVariant;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductSpecification;
import com.shop.dto.request.ProductSearchCriteria;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductDetailQueryService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public ProductDetailInfoDto queryProductDetail(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return null;
        }

        String lower = prompt.toLowerCase().trim();

        // 1. Find matched product in database
        Product product = findMatchedProduct(lower);
        if (product == null) {
            return null;
        }

        // 2. Identify requested attribute
        String attribute = "GENERAL";
        String requestedSize = null;

        Matcher mSize = Pattern.compile("\\bsize\\s*([a-zA-Z0-9]+)\\b").matcher(lower);
        if (mSize.find()) {
            attribute = "SIZE";
            requestedSize = mSize.group(1).toUpperCase();
        } else if (lower.contains("size") || lower.contains("kích cỡ")) {
            attribute = "SIZE";
        } else if (lower.contains("chất liệu") || lower.contains("vải") || lower.contains("mỏng") || lower.contains("dày") || lower.contains("len")) {
            attribute = "MATERIAL";
        } else if (lower.contains("màu") || lower.contains("color")) {
            attribute = "COLOR";
        } else if (lower.contains("còn hàng") || lower.contains("kho") || lower.contains("số lượng")) {
            attribute = "STOCK";
        }

        // 3. Extract Variant Data
        List<String> availableSizes = new ArrayList<>();
        List<String> availableColors = new ArrayList<>();
        int totalStock = 0;
        boolean isSizeAvailable = false;

        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            for (ProductVariant v : product.getVariants()) {
                int qty = v.getStock() != null ? v.getStock() : 0;
                totalStock += qty;

                if (v.getSize() != null && !availableSizes.contains(v.getSize().toUpperCase())) {
                    if (qty > 0) {
                        availableSizes.add(v.getSize().toUpperCase());
                    }
                }
                if (v.getColor() != null && !availableColors.contains(v.getColor())) {
                    availableColors.add(v.getColor());
                }

                if (requestedSize != null && v.getSize() != null && v.getSize().equalsIgnoreCase(requestedSize)) {
                    if (qty > 0) {
                        isSizeAvailable = true;
                    }
                }
            }
        }

        if (product.getColor() != null && !availableColors.contains(product.getColor())) {
            availableColors.add(product.getColor());
        }

        String primaryImageUrl = null;
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            primaryImageUrl = product.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(product.getImages().get(0).getImageUrl());
        }

        String categoryName = product.getCategory() != null ? product.getCategory().getName() : "Sản phẩm";

        // Build human-friendly answer summary
        String summary = buildAnswerSummary(product, attribute, requestedSize, isSizeAvailable, availableSizes, availableColors, totalStock);

        return ProductDetailInfoDto.builder()
                .productId(product.getId())
                .productName(product.getName())
                .price(product.getPrice())
                .categoryName(categoryName)
                .material(product.getMaterial() != null ? product.getMaterial() : "Chất liệu cao cấp")
                .description(product.getDescription())
                .requestedAttribute(attribute)
                .requestedSize(requestedSize)
                .isSizeAvailable(isSizeAvailable)
                .availableSizes(availableSizes)
                .availableColors(availableColors)
                .totalStock(totalStock)
                .primaryImageUrl(primaryImageUrl)
                .answerSummary(summary)
                .build();
    }

    private Product findMatchedProduct(String lowerPrompt) {
        // Try searching by keywords in product name
        ProductSearchCriteria criteria = ProductSearchCriteria.builder().activeOnly(true).build();
        List<Product> allProducts = productRepository.findAll(ProductSpecification.buildSpecification(criteria), PageRequest.of(0, 50)).getContent();

        for (Product p : allProducts) {
            String pNameLower = p.getName().toLowerCase();
            // Check if full product name or significant words match
            String[] words = pNameLower.split("\\s+");
            int matchCount = 0;
            for (String w : words) {
                if (w.length() > 2 && lowerPrompt.contains(w)) {
                    matchCount++;
                }
            }
            if (matchCount >= 2 || lowerPrompt.contains(pNameLower)) {
                return p;
            }
        }

        // Fallback: return the first active product
        return allProducts.isEmpty() ? null : allProducts.get(0);
    }

    private String buildAnswerSummary(Product product, String attribute, String requestedSize, boolean isSizeAvailable, List<String> availableSizes, List<String> availableColors, int totalStock) {
        StringBuilder sb = new StringBuilder();
        sb.append("Sản phẩm '").append(product.getName()).append("': ");

        if ("SIZE".equals(attribute)) {
            if (requestedSize != null) {
                if (isSizeAvailable) {
                    sb.append("Hiện ĐANG CÓ SẴN size ").append(requestedSize).append(" tại cửa hàng!");
                } else {
                    sb.append("Hiện ĐÃ HẾT size ").append(requestedSize).append(". Các size còn hàng: ").append(String.join(", ", availableSizes)).append(".");
                }
            } else {
                sb.append("Các size hiện có sẵn bao gồm: ").append(String.join(", ", availableSizes)).append(".");
            }
        } else if ("MATERIAL".equals(attribute)) {
            sb.append("Được làm từ chất liệu ").append(product.getMaterial() != null ? product.getMaterial() : "thời trang cao cấp")
              .append(". ").append(product.getDescription() != null ? product.getDescription() : "");
        } else if ("COLOR".equals(attribute)) {
            sb.append("Có các tông màu: ").append(String.join(", ", availableColors)).append(".");
        } else if ("STOCK".equals(attribute)) {
            sb.append("Hiện còn tổng cộng ").append(totalStock).append(" sản phẩm trong kho.");
        } else {
            sb.append("Giá ").append(new java.text.DecimalFormat("#,###").format(product.getPrice())).append(" VNĐ. ")
              .append("Chất liệu: ").append(product.getMaterial() != null ? product.getMaterial() : "N/A").append(".");
        }
        return sb.toString();
    }
}
