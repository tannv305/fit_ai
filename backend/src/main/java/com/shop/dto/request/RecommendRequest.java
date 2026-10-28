package com.shop.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RecommendRequest {
    private String gender;
    private BigDecimal budget;
    private String occasion;
    private String style;
    private String preferredColor;
    private String size;
}
