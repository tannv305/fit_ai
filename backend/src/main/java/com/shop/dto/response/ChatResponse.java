package com.shop.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private UUID sessionId;
    private String message;
    private String actionType; // BUILD_OUTFIT, SEARCH_PRODUCTS, GET_PRODUCT_INFO, TEXT_ONLY
    private String emotion;
    private String animation;
    private java.util.List<RecommendedProductDto> products;
    private OutfitDto outfit;
    private ProductDetailInfoDto productDetail;
}

