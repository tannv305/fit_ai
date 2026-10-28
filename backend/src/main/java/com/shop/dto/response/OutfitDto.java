package com.shop.dto.response;

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
public class OutfitDto {
    private String name;
    private BigDecimal totalPrice;
    private String reason;
    private List<RecommendedProductDto> products;
}
