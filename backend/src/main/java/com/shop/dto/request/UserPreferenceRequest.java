package com.shop.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UserPreferenceRequest {
    private String gender;
    private String preferredStyle;
    private String preferredColors;
    private BigDecimal preferredBudget;
    private String preferredCategories;
    private String preferredSizes;
}
