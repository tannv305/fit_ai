package com.shop.dto.response;

import com.shop.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDto {
    private Long id;
    private UUID userId;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private String shippingName;
    private String shippingPhone;
    private String shippingAddress;
    private String paymentMethod;
    private List<OrderItemDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
