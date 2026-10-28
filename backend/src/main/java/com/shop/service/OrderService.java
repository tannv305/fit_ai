package com.shop.service;

import com.shop.dto.request.CreateOrderRequest;
import com.shop.dto.request.UpdateOrderStatusRequest;
import com.shop.dto.response.OrderDto;
import com.shop.dto.response.OrderItemDto;
import com.shop.entity.*;
import com.shop.exception.ApiException;
import com.shop.exception.ResourceNotFoundException;
import com.shop.repository.CartRepository;
import com.shop.repository.OrderRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final CartService cartService;

    @Transactional
    public OrderDto checkout(UUID userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Cart cart = cartService.getOrCreateCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CART_EMPTY", "Cannot checkout with an empty cart");
        }

        BigDecimal totalAmount = BigDecimal.ZERO;

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .shippingName(request.getShippingName())
                .shippingPhone(request.getShippingPhone())
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "COD")
                .totalAmount(BigDecimal.ZERO)
                .build();

        for (CartItem item : cart.getItems()) {
            ProductVariant variant = item.getVariant();

            if (!variant.getProduct().getActive()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "PRODUCT_INACTIVE",
                        "Product '" + variant.getProduct().getName() + "' is no longer active");
            }

            if (variant.getStock() < item.getQuantity()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INSUFFICIENT_STOCK",
                        "Insufficient stock for '" + variant.getProduct().getName() + " (" + variant.getSize() + ")'. Available: " + variant.getStock());
            }

            // Decrement Stock
            variant.setStock(variant.getStock() - item.getQuantity());
            variantRepository.save(variant);

            BigDecimal unitPrice = variant.getProduct().getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .variant(variant)
                    .quantity(item.getQuantity())
                    .unitPrice(unitPrice)
                    .build();

            order.addItem(orderItem);
        }

        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);

        // Clear user's cart
        cart.getItems().clear();
        cartRepository.save(cart);

        return mapToDto(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getUserOrders(UUID userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(UUID userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Order does not belong to user");
        }

        return mapToDto(order);
    }

    @Transactional
    public OrderDto cancelOrder(UUID userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Order does not belong to user");
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CANNOT_CANCEL_ORDER",
                    "Order cannot be cancelled in status " + order.getStatus());
        }

        order.setStatus(OrderStatus.CANCELLED);

        // Restore Stock
        for (OrderItem item : order.getItems()) {
            ProductVariant variant = item.getVariant();
            variant.setStock(variant.getStock() + item.getQuantity());
            variantRepository.save(variant);
        }

        Order updated = orderRepository.save(order);
        return mapToDto(updated);
    }

    // Admin APIs
    @Transactional(readOnly = true)
    public Page<OrderDto> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable).map(this::mapToDto);
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        order.setStatus(request.getStatus());
        Order updated = orderRepository.save(order);
        return mapToDto(updated);
    }

    public OrderDto mapToDto(Order order) {
        List<OrderItemDto> itemDtos = order.getItems().stream().map(item -> {
            ProductVariant variant = item.getVariant();
            Product product = variant.getProduct();
            String primaryImage = product.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getImageUrl());

            BigDecimal subtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));

            return OrderItemDto.builder()
                    .id(item.getId())
                    .variantId(variant.getId())
                    .productId(product.getId())
                    .productName(product.getName())
                    .productImageUrl(primaryImage)
                    .size(variant.getSize())
                    .color(variant.getColor())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .itemSubtotal(subtotal)
                    .build();
        }).collect(Collectors.toList());

        return OrderDto.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .shippingName(order.getShippingName())
                .shippingPhone(order.getShippingPhone())
                .shippingAddress(order.getShippingAddress())
                .paymentMethod(order.getPaymentMethod())
                .items(itemDtos)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
