package com.shop.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private String name;
    private String description;
    private BigDecimal price;
    private String gender;
    private String style;
    private String color;
    private String material;
    private String season;
    private String occasion;
    private String fit;
    private Boolean active;
    private String primaryImageUrl;
    private List<ProductImageDto> images;
    private List<ProductVariantDto> variants;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
