package com.shop.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductRequest {

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    @NotBlank(message = "Product name is required")
    @Size(max = 255)
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price cannot be negative")
    private BigDecimal price;

    private String gender;
    private String style;
    private String color;
    private String material;
    private String season;
    private String occasion;
    private String fit;
    private Boolean active = true;

    private List<ProductImageRequest> images;
    private List<ProductVariantRequest> variants;

    @Data
    public static class ProductImageRequest {
        @NotBlank(message = "Image URL is required")
        private String imageUrl;
        private String publicId;
        private Boolean isPrimary = false;
    }

    @Data
    public static class ProductVariantRequest {
        @NotBlank(message = "SKU is required")
        private String sku;
        @NotBlank(message = "Size is required")
        private String size;
        @NotBlank(message = "Color is required")
        private String color;
        @NotNull(message = "Stock is required")
        @Min(value = 0, message = "Stock cannot be negative")
        private Integer stock;
    }
}
