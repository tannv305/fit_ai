package com.shop.service;

import com.shop.dto.request.ProductSearchCriteria;
import com.shop.dto.response.OutfitDto;
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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutfitCompositionService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public OutfitDto composeOutfit(ProductSearchCriteria baseCriteria, String userPrompt) {
        BigDecimal budget = baseCriteria.getMaxPrice();
        if (budget == null || budget.compareTo(BigDecimal.ZERO) <= 0) {
            budget = new BigDecimal("1500000"); // Default budget fallback 1.5M VND
        }

        boolean isColdWeather = Boolean.TRUE.equals(baseCriteria.getIsColdWeather()) ||
                "Sapa".equalsIgnoreCase(baseCriteria.getDestination()) ||
                "Đà Lạt".equalsIgnoreCase(baseCriteria.getDestination());

        // Fetch candidates for Tops (Cat 1), Bottoms (Cat 2), Dresses (Cat 3), Outerwear (Cat 4), Shoes (Cat 5)
        List<Product> tops = fetchCandidatesForCategory(baseCriteria, 1L, isColdWeather);
        List<Product> bottoms = fetchCandidatesForCategory(baseCriteria, 2L, isColdWeather);
        List<Product> dresses = fetchCandidatesForCategory(baseCriteria, 3L, isColdWeather);
        List<Product> outerwear = fetchCandidatesForCategory(baseCriteria, 4L, isColdWeather);
        List<Product> shoes = fetchCandidatesForCategory(baseCriteria, 5L, isColdWeather);

        List<CandidateOutfit> validOutfits = new ArrayList<>();

        // Type 1: Top + Bottom (+ Outerwear / Shoes)
        for (Product top : tops) {
            for (Product bottom : bottoms) {
                BigDecimal sum = top.getPrice().add(bottom.getPrice());
                if (sum.compareTo(budget) <= 0) {
                    // Scenario A: Top + Bottom + Outerwear (+ Shoes)
                    for (Product outer : outerwear) {
                        BigDecimal sumWithOuter = sum.add(outer.getPrice());
                        if (sumWithOuter.compareTo(budget) <= 0) {
                            List<Product> items = new ArrayList<>(List.of(top, bottom, outer));
                            BigDecimal currentSum = sumWithOuter;

                            // Try adding shoes
                            for (Product shoe : shoes) {
                                if (currentSum.add(shoe.getPrice()).compareTo(budget) <= 0) {
                                    items.add(shoe);
                                    currentSum = currentSum.add(shoe.getPrice());
                                    break;
                                }
                            }
                            validOutfits.add(new CandidateOutfit(items, currentSum, calculateScore(items, baseCriteria, isColdWeather)));
                        }
                    }

                    // Scenario B: Top + Bottom (+ Shoes without Outerwear, used if budget doesn't fit outerwear or non-cold)
                    List<Product> itemsWO = new ArrayList<>(List.of(top, bottom));
                    BigDecimal sumWO = sum;
                    for (Product shoe : shoes) {
                        if (sumWO.add(shoe.getPrice()).compareTo(budget) <= 0) {
                            itemsWO.add(shoe);
                            sumWO = sumWO.add(shoe.getPrice());
                            break;
                        }
                    }
                    validOutfits.add(new CandidateOutfit(itemsWO, sumWO, calculateScore(itemsWO, baseCriteria, isColdWeather)));
                }
            }
        }

        // Type 2: Dress (+ Outerwear / Shoes)
        for (Product dress : dresses) {
            BigDecimal sum = dress.getPrice();
            if (sum.compareTo(budget) <= 0) {
                List<Product> items = new ArrayList<>(List.of(dress));
                BigDecimal currentSum = sum;

                for (Product outer : outerwear) {
                    if (currentSum.add(outer.getPrice()).compareTo(budget) <= 0) {
                        items.add(outer);
                        currentSum = currentSum.add(outer.getPrice());
                        break;
                    }
                }

                for (Product shoe : shoes) {
                    if (currentSum.add(shoe.getPrice()).compareTo(budget) <= 0) {
                        items.add(shoe);
                        currentSum = currentSum.add(shoe.getPrice());
                        break;
                    }
                }

                validOutfits.add(new CandidateOutfit(items, currentSum, calculateScore(items, baseCriteria, isColdWeather)));
            }
        }

        // Fallback if no combo found
        if (validOutfits.isEmpty()) {
            if (!tops.isEmpty() && !bottoms.isEmpty()) {
                Product top = tops.get(0);
                Product bottom = bottoms.get(0);
                List<Product> items = List.of(top, bottom);
                BigDecimal sum = top.getPrice().add(bottom.getPrice());
                validOutfits.add(new CandidateOutfit(items, sum, 10));
            } else if (!dresses.isEmpty()) {
                Product dress = dresses.get(0);
                validOutfits.add(new CandidateOutfit(List.of(dress), dress.getPrice(), 10));
            } else {
                return null;
            }
        }

        // Select best Candidate Outfit with highest score
        CandidateOutfit bestOutfit = validOutfits.stream()
                .max(Comparator.comparingInt(CandidateOutfit::score))
                .orElse(validOutfits.get(0));

        // Map items to RecommendedProductDto
        List<RecommendedProductDto> productDtos = bestOutfit.items().stream().map(p -> {
            String primaryImage = p.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(p.getImages().isEmpty() ? null : p.getImages().get(0).getImageUrl());

            String categoryName = p.getCategory() != null ? p.getCategory().getName() : "Trang phục";
            return RecommendedProductDto.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .price(p.getPrice())
                    .categoryName(categoryName)
                    .primaryImageUrl(primaryImage)
                    .reason("Phù hợp outfit (" + (p.getStyle() != null ? p.getStyle() : "Fashion") + ")")
                    .build();
        }).collect(Collectors.toList());

        String styleName = baseCriteria.getStyle() != null ? baseCriteria.getStyle() : "Fashion";
        String destinationText = baseCriteria.getDestination() != null ? " tại " + baseCriteria.getDestination() : "";
        String outfitTitle = "Outfit " + styleName + destinationText;

        String weatherNotice = isColdWeather ? " phù hợp giữ ấm cho thời tiết lạnh" : "";
        String reasonText = "Phối đồ phong cách " + styleName.toLowerCase() + weatherNotice +
                ", tổng giá " + new java.text.DecimalFormat("#,###").format(bestOutfit.totalPrice()) +
                " VNĐ nằm trong ngân sách " + new java.text.DecimalFormat("#,###").format(budget) + " VNĐ.";

        return OutfitDto.builder()
                .name(outfitTitle)
                .totalPrice(bestOutfit.totalPrice())
                .reason(reasonText)
                .products(productDtos)
                .build();
    }

    private List<Product> fetchCandidatesForCategory(ProductSearchCriteria baseCriteria, Long categoryId, boolean isColdWeather) {
        // Step 1: Strict query with style & gender
        ProductSearchCriteria criteria = ProductSearchCriteria.builder()
                .categoryId(categoryId)
                .gender(baseCriteria.getGender())
                .style(baseCriteria.getStyle())
                .activeOnly(true)
                .build();

        List<Product> results = productRepository.findAll(ProductSpecification.buildSpecification(criteria), PageRequest.of(0, 10)).getContent();

        // Step 2: If empty for that specific style in category, relax style constraint but keep gender
        if (results.isEmpty()) {
            ProductSearchCriteria relaxedCriteria = ProductSearchCriteria.builder()
                    .categoryId(categoryId)
                    .gender(baseCriteria.getGender())
                    .activeOnly(true)
                    .build();
            results = productRepository.findAll(ProductSpecification.buildSpecification(relaxedCriteria), PageRequest.of(0, 10)).getContent();
        }

        // Step 3: Generic fallback for category if empty
        if (results.isEmpty()) {
            ProductSearchCriteria basicCriteria = ProductSearchCriteria.builder()
                    .categoryId(categoryId)
                    .activeOnly(true)
                    .build();
            results = productRepository.findAll(ProductSpecification.buildSpecification(basicCriteria), PageRequest.of(0, 10)).getContent();
        }

        // Apply cold weather filtering (exclude shorts & sleeveless items for cold weather like Sapa)
        if (isColdWeather && results != null) {
            results = results.stream()
                    .filter(p -> {
                        String name = p.getName().toLowerCase();
                        if (name.contains("short") || name.contains("đùi") || name.contains("ba lỗ")) {
                            return false;
                        }
                        return true;
                    })
                    .collect(Collectors.toList());
        }

        return results;
    }

    private int calculateScore(List<Product> items, ProductSearchCriteria criteria, boolean isColdWeather) {
        int score = 100;

        boolean hasOuterwear = false;
        boolean hasShorts = false;

        for (Product item : items) {
            String style = item.getStyle();
            String name = item.getName().toLowerCase();
            String color = item.getColor() != null ? item.getColor() : "";

            if (criteria.getStyle() != null) {
                if (criteria.getStyle().equalsIgnoreCase(style)) {
                    score += 30; // Style match bonus
                } else {
                    score -= 25; // Style mismatch penalty
                }
            }

            if (name.contains("khoác") || name.contains("jacket") || name.contains("hoodie") || name.contains("cardigan")) {
                hasOuterwear = true;
            }
            if (name.contains("short") || name.contains("đùi")) {
                hasShorts = true;
            }

            if ("DARK".equalsIgnoreCase(criteria.getColorPreference()) || "BLACK".equalsIgnoreCase(criteria.getColor())) {
                if (isDarkColor(color, name)) {
                    score += 15;
                }
            }
        }

        if (isColdWeather) {
            if (hasOuterwear) {
                score += 60; // Major bonus for outerwear in cold weather
            }
            if (hasShorts) {
                score -= 200; // Strict penalty for shorts in cold weather
            }
        }

        return score;
    }

    private boolean isDarkColor(String color, String productName) {
        String combined = (color + " " + productName).toLowerCase();
        return combined.contains("black") || combined.contains("đen") || combined.contains("tối") ||
                combined.contains("xám") || combined.contains("navy") || combined.contains("indigo") ||
                combined.contains("bụi") || combined.contains("nâu") || combined.contains("brown") ||
                combined.contains("rêu") || combined.contains("dark");
    }

    private record CandidateOutfit(List<Product> items, BigDecimal totalPrice, int score) {}
}

