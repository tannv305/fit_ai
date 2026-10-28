package com.shop.service;

import com.shop.dto.request.ProductSearchCriteria;
import com.shop.dto.request.RecommendRequest;
import com.shop.dto.response.ChatResponse;
import com.shop.dto.response.RecommendedProductDto;
import com.shop.entity.Product;
import com.shop.entity.ProductImage;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shop.dto.response.OutfitDto;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public ChatResponse recommendOutfit(RecommendRequest request) {
        ProductSearchCriteria criteria = ProductSearchCriteria.builder()
                .gender(request.getGender())
                .style(request.getStyle())
                .color(request.getPreferredColor())
                .size(request.getSize())
                .occasion(request.getOccasion())
                .maxPrice(request.getBudget())
                .activeOnly(true)
                .build();

        Specification<Product> spec = ProductSpecification.buildSpecification(criteria);
        List<Product> products = productRepository.findAll(spec, PageRequest.of(0, 6)).getContent();

        if (products.isEmpty()) {
            criteria.setMaxPrice(null);
            products = productRepository.findAll(ProductSpecification.buildSpecification(criteria), PageRequest.of(0, 4)).getContent();
        }

        List<RecommendedProductDto> recommendedProducts = products.stream().map(p -> {
            String primaryImage = p.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl());

            String categoryName = p.getCategory() != null ? p.getCategory().getName() : "Thời trang";
            String occasion = request.getOccasion() != null ? request.getOccasion() : "hàng ngày";
            String style = p.getStyle() != null ? p.getStyle() : "Casual";

            return RecommendedProductDto.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .price(p.getPrice())
                    .categoryName(categoryName)
                    .primaryImageUrl(primaryImage)
                    .reason("Phù hợp cho dịp " + occasion + " phong cách " + style)
                    .build();
        }).collect(Collectors.toList());

        BigDecimal totalPrice = recommendedProducts.stream()
                .map(RecommendedProductDto::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        OutfitDto outfit = OutfitDto.builder()
                .name("Gợi ý Outfit Theo Yêu Cầu")
                .totalPrice(totalPrice)
                .reason("Gợi ý phong cách " + (request.getStyle() != null ? request.getStyle() : "thời trang") + " phù hợp với bạn.")
                .products(recommendedProducts)
                .build();

        String message = "Dưới đây là các gợi ý outfit tối ưu cho thông số của bạn:";
        return ChatResponse.builder()
                .sessionId(null)
                .message(message)
                .emotion("happy")
                .animation("recommend")
                .outfit(outfit)
                .build();
    }
}
