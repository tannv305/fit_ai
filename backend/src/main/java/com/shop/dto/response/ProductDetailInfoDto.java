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
public class ProductDetailInfoDto {
    private Long productId;
    private String productName;
    private BigDecimal price;
    private String categoryName;
    private String material;
    private String description;
    private String requestedAttribute; // SIZE, MATERIAL, COLOR, STOCK, GENERAL
    private Boolean isSizeAvailable;
    private String requestedSize;
    private List<String> availableSizes;
    private List<String> availableColors;
    private Integer totalStock;
    private String primaryImageUrl;
    private String answerSummary;
}
