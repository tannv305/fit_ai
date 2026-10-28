package com.shop.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendedProductDto {
    private Long id;
    private String name;
    private BigDecimal price;
    private String categoryName;
    private String primaryImageUrl;
    private String reason;
}
