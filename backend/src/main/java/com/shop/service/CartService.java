package com.shop.service;

import com.shop.dto.request.AddToCartRequest;
import com.shop.dto.request.UpdateCartItemRequest;
import com.shop.dto.response.CartDto;
import com.shop.dto.response.CartItemDto;
import com.shop.dto.response.MessageResponse;
import com.shop.entity.*;
import com.shop.exception.ApiException;
import com.shop.exception.ResourceNotFoundException;
import com.shop.repository.CartItemRepository;
import com.shop.repository.CartRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;

    @Transactional
    public Cart getOrCreateCart(UUID userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                    Cart cart = Cart.builder().user(user).build();
                    return cartRepository.save(cart);
                });
    }

    @Transactional(readOnly = true)
    public CartDto getCartDto(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        return mapToDto(cart);
    }

    @Transactional
    public CartDto addItemToCart(UUID userId, AddToCartRequest request) {
        Cart cart = getOrCreateCart(userId);
        ProductVariant variant = variantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", request.getVariantId()));

        if (!variant.getProduct().getActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PRODUCT_INACTIVE", "Cannot add inactive product to cart");
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variant.getId());

        int newQuantity = request.getQuantity();
        if (existingItemOpt.isPresent()) {
            newQuantity += existingItemOpt.get().getQuantity();
        }

        if (newQuantity > variant.getStock()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INSUFFICIENT_STOCK",
                    "Requested quantity exceeds available stock (" + variant.getStock() + ")");
        }

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .variant(variant)
                    .quantity(request.getQuantity())
                    .build();
            cart.addItem(newItem);
            cartRepository.save(cart);
        }

        return mapToDto(cart);
    }

    @Transactional
    public CartDto updateCartItem(UUID userId, Long cartItemId, UpdateCartItemRequest request) {
        Cart cart = getOrCreateCart(userId);
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Cart item does not belong to user's cart");
        }

        if (request.getQuantity() > cartItem.getVariant().getStock()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INSUFFICIENT_STOCK",
                    "Requested quantity exceeds available stock (" + cartItem.getVariant().getStock() + ")");
        }

        cartItem.setQuantity(request.getQuantity());
        cartItemRepository.save(cartItem);

        return mapToDto(cart);
    }

    @Transactional
    public CartDto removeCartItem(UUID userId, Long cartItemId) {
        Cart cart = getOrCreateCart(userId);
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Cart item does not belong to user's cart");
        }

        cart.removeItem(cartItem);
        cartRepository.save(cart);

        return mapToDto(cart);
    }

    @Transactional
    public MessageResponse clearCart(UUID userId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        cartRepository.save(cart);
        return new MessageResponse("Cart cleared successfully");
    }

    public CartDto mapToDto(Cart cart) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        int totalItems = 0;

        var itemsDto = new ArrayList<CartItemDto>();
        for (CartItem item : cart.getItems()) {
            ProductVariant variant = item.getVariant();
            Product product = variant.getProduct();

            BigDecimal price = product.getPrice();
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));

            totalAmount = totalAmount.add(subtotal);
            totalItems += item.getQuantity();

            String primaryImage = product.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getImageUrl());

            itemsDto.add(CartItemDto.builder()
                    .id(item.getId())
                    .variantId(variant.getId())
                    .productId(product.getId())
                    .productName(product.getName())
                    .productImageUrl(primaryImage)
                    .size(variant.getSize())
                    .color(variant.getColor())
                    .unitPrice(price)
                    .quantity(item.getQuantity())
                    .itemSubtotal(subtotal)
                    .availableStock(variant.getStock())
                    .build());
        }

        return CartDto.builder()
                .id(cart.getId())
                .items(itemsDto)
                .totalAmount(totalAmount)
                .totalItems(totalItems)
                .build();
    }
}
