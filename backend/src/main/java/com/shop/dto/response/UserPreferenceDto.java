package com.shop.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferenceDto {
    private UUID id;
    private UUID userId;
    private String gender;
    private String preferredStyle;
    private String preferredColors;
    private BigDecimal preferredBudget;
    private String preferredCategories;
    private String preferredSizes;
}
