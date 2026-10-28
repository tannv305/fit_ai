package com.shop.controller;

import com.shop.dto.request.AddToCartRequest;
import com.shop.dto.request.UpdateCartItemRequest;
import com.shop.dto.response.CartDto;
import com.shop.dto.response.MessageResponse;
import com.shop.security.UserPrincipal;
import com.shop.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartDto> getCart(@AuthenticationPrincipal UserPrincipal currentUser) {
        CartDto cart = cartService.getCartDto(currentUser.getId());
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/items")
    public ResponseEntity<CartDto> addItemToCart(@AuthenticationPrincipal UserPrincipal currentUser,
                                                 @Valid @RequestBody AddToCartRequest request) {
        CartDto cart = cartService.addItemToCart(currentUser.getId(), request);
        return ResponseEntity.ok(cart);
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<CartDto> updateCartItem(@AuthenticationPrincipal UserPrincipal currentUser,
                                                   @PathVariable Long id,
                                                   @Valid @RequestBody UpdateCartItemRequest request) {
        CartDto cart = cartService.updateCartItem(currentUser.getId(), id, request);
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<CartDto> removeCartItem(@AuthenticationPrincipal UserPrincipal currentUser,
                                                   @PathVariable Long id) {
        CartDto cart = cartService.removeCartItem(currentUser.getId(), id);
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping
    public ResponseEntity<MessageResponse> clearCart(@AuthenticationPrincipal UserPrincipal currentUser) {
        MessageResponse response = cartService.clearCart(currentUser.getId());
        return ResponseEntity.ok(response);
    }
}
