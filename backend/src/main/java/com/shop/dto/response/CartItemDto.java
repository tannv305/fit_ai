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
public class CartItemDto {
    private Long id;
    private Long variantId;
    private Long productId;
    private String productName;
    private String productImageUrl;
    private String size;
    private String color;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal itemSubtotal;
    private Integer availableStock;
}
