package com.shop.controller;

import com.shop.dto.request.CreateOrderRequest;
import com.shop.dto.response.OrderDto;
import com.shop.security.UserPrincipal;
import com.shop.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderDto> createOrder(@AuthenticationPrincipal UserPrincipal currentUser,
                                                @Valid @RequestBody CreateOrderRequest request) {
        OrderDto order = orderService.checkout(currentUser.getId(), request);
        return new ResponseEntity<>(order, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<OrderDto>> getUserOrders(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<OrderDto> orders = orderService.getUserOrders(currentUser.getId());
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrderById(@AuthenticationPrincipal UserPrincipal currentUser,
                                                  @PathVariable Long id) {
        OrderDto order = orderService.getOrderById(currentUser.getId(), id);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderDto> cancelOrder(@AuthenticationPrincipal UserPrincipal currentUser,
                                                 @PathVariable Long id) {
        OrderDto order = orderService.cancelOrder(currentUser.getId(), id);
        return ResponseEntity.ok(order);
    }
}
