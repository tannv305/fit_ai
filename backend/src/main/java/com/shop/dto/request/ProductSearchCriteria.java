package com.shop.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSearchCriteria {
    private String search;
    private Long categoryId;
    private String categoryName;
    private String gender;
    private String style;
    private String color;
    private String size;
    private String occasion;
    private String season;
    private String material;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private List<String> keywords;

    private String destination;
    private String colorPreference; // "DARK", "LIGHT", or specific
    private Boolean isColdWeather;

    @Builder.Default
    private Boolean activeOnly = true;
}

