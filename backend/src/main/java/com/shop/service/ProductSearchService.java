package com.shop.service;

import com.shop.dto.request.ProductSearchCriteria;
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

import com.shop.entity.UserPreference;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductSearchService {

    private final ProductRepository productRepository;
    private final UserPreferenceService userPreferenceService;

    public String determineActionType(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return "TEXT_ONLY";
        }
        String lower = prompt.toLowerCase().trim();

        // 1. Check for Product Detail / Attribute Query Intent (GET_PRODUCT_INFO)
        if (lower.contains("size") || lower.contains("chất liệu") || lower.contains("mã ") ||
            lower.contains("vải") || lower.contains("len mỏng") || lower.contains("len dày") ||
            lower.contains("còn màu") || lower.contains("có màu") || lower.contains("còn size") ||
            lower.contains("có size") || lower.contains("thông số") || lower.contains("còn hàng không")) {
            return "GET_PRODUCT_INFO";
        }

        // 2. Check for Outfit / Composition Intent (BUILD_OUTFIT)
        if (lower.contains("phối") || lower.contains("outfit") || lower.contains("set đồ") ||
            lower.contains("set ") || lower.contains("trang phục") || lower.contains("du lịch") ||
            lower.contains("sapa") || lower.contains("đà lạt") || lower.contains("đi tiệc") ||
            lower.contains("đi chơi") || lower.contains("bộ đồ") || lower.contains("phối cho") ||
            lower.contains("phỏng vấn") || lower.contains("mặc nhà")) {
            return "BUILD_OUTFIT";
        }

        // 3. Check for Individual Product Search Intent (SEARCH_PRODUCTS)
        if (lower.contains("top") || lower.contains("tìm") || lower.contains("sản phẩm") ||
            lower.contains("danh sách") || lower.contains("xem đồ") || lower.contains("gợi ý món") ||
            lower.contains("áo") || lower.contains("quần") || lower.contains("váy") || lower.contains("đầm") ||
            lower.contains("khoác") || lower.contains("item") || lower.contains("mẫu mới")) {
            return "SEARCH_PRODUCTS";
        }

        // 4. Fallback to TEXT_ONLY for general greetings/chitchat
        return "TEXT_ONLY";
    }

    public int parseLimitFromPrompt(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return 5;
        }
        String lower = prompt.toLowerCase().trim();

        // Pattern A: "top 10", "top 3", "top 4"
        java.util.regex.Matcher mTop = java.util.regex.Pattern.compile("\\btop\\s*(\\d{1,2})\\b").matcher(lower);
        if (mTop.find()) {
            return clampLimit(Integer.parseInt(mTop.group(1)));
        }

        // Pattern B: "10 item", "3 món", "4 sản phẩm", "5 cái"
        java.util.regex.Matcher mCount = java.util.regex.Pattern.compile("\\b(\\d{1,2})\\s*(?:item|món|sản phẩm|cái|áo|quần|bộ|đồ)\\b").matcher(lower);
        if (mCount.find()) {
            return clampLimit(Integer.parseInt(mCount.group(1)));
        }

        return 5;
    }

    private int clampLimit(int val) {
        if (val <= 0) return 5;
        return Math.min(val, 20);
    }

    public ProductSearchCriteria parseCriteriaFromPrompt(String prompt, UUID userId) {
        ProductSearchCriteria criteria = parseCriteriaFromPrompt(prompt);
        if (userId != null) {
            UserPreference pref = userPreferenceService.getPreferenceEntity(userId);
            if (pref != null) {
                if (criteria.getGender() == null && pref.getGender() != null) {
                    criteria.setGender(pref.getGender());
                }
                if (criteria.getStyle() == null && pref.getPreferredStyle() != null) {
                    criteria.setStyle(pref.getPreferredStyle());
                }
                if (criteria.getMaxPrice() == null && pref.getPreferredBudget() != null) {
                    criteria.setMaxPrice(pref.getPreferredBudget());
                }
                if (criteria.getColor() == null && pref.getPreferredColors() != null && !pref.getPreferredColors().isBlank()) {
                    criteria.setColor(pref.getPreferredColors().split(",")[0].trim());
                }
            }
        }
        return criteria;
    }

    public ProductSearchCriteria parseCriteriaFromPrompt(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return ProductSearchCriteria.builder().activeOnly(true).build();
        }

        String lower = prompt.toLowerCase().trim();
        ProductSearchCriteria criteria = ProductSearchCriteria.builder()
                .activeOnly(true)
                .build();

        // 1. Gender parsing
        if (lower.contains("nam") || lower.contains("men")) {
            criteria.setGender("MALE");
        } else if (lower.contains("nữ") || lower.contains("nu") || lower.contains("women")) {
            criteria.setGender("FEMALE");
        }

        // 2. Style & Occasion parsing
        if (lower.contains("streetwear") || lower.contains("bụi bặm") || lower.contains("bụi") || lower.contains("hiphop")) {
            criteria.setStyle("STREETWEAR");
            criteria.setOccasion("Streetwear");
        } else if (lower.contains("vintage") || lower.contains("cổ điển") || lower.contains("retro")) {
            criteria.setStyle("VINTAGE");
            criteria.setOccasion("Vintage");
        } else if (lower.contains("sporty") || lower.contains("thể thao") || lower.contains("gym") || lower.contains("chạy bộ")) {
            criteria.setStyle("SPORTY");
            criteria.setOccasion("Sport");
        } else if (lower.contains("korean") || lower.contains("hàn quốc") || lower.contains("k-style")) {
            criteria.setStyle("KOREAN");
            criteria.setOccasion("Daily");
        } else if (lower.contains("minimalist") || lower.contains("tối giản") || lower.contains("đơn giản")) {
            criteria.setStyle("MINIMALIST");
            criteria.setOccasion("Daily");
        } else if (lower.contains("dự tiệc") || lower.contains("tiệc") || lower.contains("party") || lower.contains("dạ hội")) {
            criteria.setStyle("FORMAL");
            criteria.setOccasion("Party");
        } else if (lower.contains("công sở") || lower.contains("office") || lower.contains("lịch sự")) {
            criteria.setStyle("FORMAL");
            criteria.setOccasion("Office");
        } else if (lower.contains("dạo phố") || lower.contains("thường ngày") || lower.contains("casual") || lower.contains("đi chơi")) {
            criteria.setStyle("CASUAL");
            criteria.setOccasion("Casual");
        }

        // 3. Destination & Weather Mapping
        if (lower.contains("sapa") || lower.contains("sa pa")) {
            criteria.setDestination("Sapa");
            criteria.setIsColdWeather(true);
        } else if (lower.contains("đà lạt") || lower.contains("da lat") || lower.contains("lạnh") || lower.contains("se lạnh") || lower.contains("mùa đông")) {
            criteria.setDestination("Đà Lạt");
            criteria.setIsColdWeather(true);
        } else if (lower.contains("cần thơ") || lower.contains("tphcm") || lower.contains("sài gòn") || lower.contains("nóng")) {
            criteria.setDestination("Miền Nam");
            criteria.setIsColdWeather(false);
        }

        // 4. Color & Tone Preference parsing
        if (lower.contains("màu tối") || lower.contains("tối") || lower.contains("dark")) {
            criteria.setColorPreference("DARK");
            criteria.setColor("BLACK");
        } else if (lower.contains("màu sáng") || lower.contains("sáng") || lower.contains("light")) {
            criteria.setColorPreference("LIGHT");
            criteria.setColor("WHITE");
        } else if (lower.contains("đen") || lower.contains("black")) {
            criteria.setColor("BLACK");
        } else if (lower.contains("trắng") || lower.contains("white")) {
            criteria.setColor("WHITE");
        } else if (lower.contains("xanh") || lower.contains("blue")) {
            criteria.setColor("BLUE");
        } else if (lower.contains("nâu") || lower.contains("brown")) {
            criteria.setColor("BROWN");
        } else if (lower.contains("đỏ") || lower.contains("red")) {
            criteria.setColor("RED");
        }

        // 5. Accurate Numeric Budget Extraction
        BigDecimal extractedBudget = parseNumericBudget(lower);
        if (extractedBudget != null) {
            criteria.setMaxPrice(extractedBudget);
        }

        // 6. Keywords
        List<String> keywords = new ArrayList<>();
        if (lower.contains("sơ mi") || lower.contains("áo sơ mi")) {
            keywords.add("sơ mi");
        } else if (lower.contains("thun") || lower.contains("áo thun")) {
            keywords.add("thun");
        } else if (lower.contains("quần")) {
            keywords.add("quần");
        } else if (lower.contains("khoác") || lower.contains("jacket") || lower.contains("hoodie")) {
            keywords.add("khoác");
        }

        if (!keywords.isEmpty()) {
            criteria.setKeywords(keywords);
        }

        return criteria;
    }

    private BigDecimal parseNumericBudget(String prompt) {
        if (prompt == null) return null;
        String lower = prompt.toLowerCase();

        // 1. Full formatted number (e.g., 1.500.000, 1,500,000, 2.500.000)
        java.util.regex.Matcher mFull = java.util.regex.Pattern.compile("(\\d{1,2})[.,](\\d{3})[.,](\\d{3})").matcher(lower);
        if (mFull.find()) {
            String raw = mFull.group(1) + mFull.group(2) + mFull.group(3);
            return new BigDecimal(raw);
        }

        // 2. Short Million notation (e.g., 1tr5, 2tr5, 1tr8, 2tr2)
        java.util.regex.Matcher mTrHalf = java.util.regex.Pattern.compile("(\\d+)tr(\\d+)").matcher(lower);
        if (mTrHalf.find()) {
            long mainPart = Long.parseLong(mTrHalf.group(1));
            long decPart = Long.parseLong(mTrHalf.group(2));
            if (decPart < 10) decPart = decPart * 100000;
            else if (decPart < 100) decPart = decPart * 10000;
            return new BigDecimal(mainPart * 1000000 + decPart);
        }

        // 3. Decimal Million notation (e.g., 1.5tr, 1,5tr, 1.5 triệu, 2.5 triệu)
        java.util.regex.Matcher mTrDec = java.util.regex.Pattern.compile("(\\d+[.,]\\d+)\\s*(?:tr|triệu|trieu|m)").matcher(lower);
        if (mTrDec.find()) {
            double val = Double.parseDouble(mTrDec.group(1).replace(",", "."));
            return BigDecimal.valueOf((long) (val * 1000000));
        }

        // 4. Integer Million notation (e.g., 1tr, 2tr, 1 triệu, 2 triệu, 3tr)
        java.util.regex.Matcher mTrInt = java.util.regex.Pattern.compile("(\\d+)\\s*(?:tr|triệu|trieu|m)\\b").matcher(lower);
        if (mTrInt.find()) {
            long val = Long.parseLong(mTrInt.group(1));
            return BigDecimal.valueOf(val * 1000000);
        }

        // 5. Thousand format (e.g., 500.000, 800.000, 300.000)
        java.util.regex.Matcher mKDot = java.util.regex.Pattern.compile("\\b(\\d{2,3})[.,](\\d{3})\\b").matcher(lower);
        if (mKDot.find()) {
            String raw = mKDot.group(1) + mKDot.group(2);
            return new BigDecimal(raw);
        }

        // 6. Thousand 'k' notation (e.g., 500k, 800k, 300k)
        java.util.regex.Matcher mK = java.util.regex.Pattern.compile("(\\d+)\\s*k\\b").matcher(lower);
        if (mK.find()) {
            long val = Long.parseLong(mK.group(1));
            return BigDecimal.valueOf(val * 1000);
        }

        return null;
    }

    @Transactional(readOnly = true)
    public List<Product> searchProducts(ProductSearchCriteria criteria, int limit) {
        int fetchSize = limit > 0 ? limit : 5;
        Specification<Product> spec = ProductSpecification.buildSpecification(criteria);
        List<Product> results = productRepository.findAll(spec, PageRequest.of(0, fetchSize)).getContent();

        // Level 1 Fallback: If no match, relax maxPrice constraint
        if (results.isEmpty() && criteria.getMaxPrice() != null) {
            ProductSearchCriteria fallbackCriteria = ProductSearchCriteria.builder()
                    .gender(criteria.getGender())
                    .style(criteria.getStyle())
                    .color(criteria.getColor())
                    .categoryName(criteria.getCategoryName())
                    .keywords(criteria.getKeywords())
                    .activeOnly(true)
                    .build();
            results = productRepository.findAll(ProductSpecification.buildSpecification(fallbackCriteria), PageRequest.of(0, fetchSize)).getContent();
        }

        // Level 2 Fallback: If still empty, return top active products in shop
        if (results.isEmpty()) {
            ProductSearchCriteria basicCriteria = ProductSearchCriteria.builder().activeOnly(true).build();
            results = productRepository.findAll(ProductSpecification.buildSpecification(basicCriteria), PageRequest.of(0, fetchSize)).getContent();
        }

        return results;
    }

    @Transactional(readOnly = true)
    public List<RecommendedProductDto> searchAndMapToRecommendedDtos(ProductSearchCriteria criteria, String userPrompt, int limit) {
        List<Product> matchedProducts = searchProducts(criteria, limit);

        return matchedProducts.stream().map(p -> {
            String primaryImage = p.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl());

            String categoryName = p.getCategory() != null ? p.getCategory().getName() : "Sản phẩm";
            String styleInfo = p.getStyle() != null ? p.getStyle() : "Fashion";

            return RecommendedProductDto.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .price(p.getPrice())
                    .categoryName(categoryName)
                    .primaryImageUrl(primaryImage)
                    .reason("Phù hợp với nhu cầu '" + userPrompt + "' (" + styleInfo + ")")
                    .build();
        }).collect(Collectors.toList());
    }
}
