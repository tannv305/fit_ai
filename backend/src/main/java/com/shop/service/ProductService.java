package com.shop.service;

import com.shop.dto.request.ProductRequest;
import com.shop.dto.request.ProductSearchCriteria;
import com.shop.dto.response.MessageResponse;
import com.shop.dto.response.ProductDto;
import com.shop.dto.response.ProductImageDto;
import com.shop.dto.response.ProductVariantDto;
import com.shop.entity.Category;
import com.shop.entity.Product;
import com.shop.entity.ProductImage;
import com.shop.entity.ProductVariant;
import com.shop.exception.ApiException;
import com.shop.exception.ResourceNotFoundException;
import com.shop.repository.CategoryRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductSpecification;
import com.shop.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository variantRepository;

    @Transactional(readOnly = true)
    public Page<ProductDto> getProducts(ProductSearchCriteria criteria, Pageable pageable) {
        Specification<Product> spec = ProductSpecification.buildSpecification(criteria);
        return productRepository.findAll(spec, pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public ProductDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return mapToDto(product);
    }

    @Transactional
    public ProductDto createProduct(ProductRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        Product product = Product.builder()
                .category(category)
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .gender(request.getGender())
                .style(request.getStyle())
                .color(request.getColor())
                .material(request.getMaterial())
                .season(request.getSeason())
                .occasion(request.getOccasion())
                .fit(request.getFit())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        if (request.getImages() != null) {
            for (ProductRequest.ProductImageRequest imgReq : request.getImages()) {
                ProductImage image = ProductImage.builder()
                        .imageUrl(imgReq.getImageUrl())
                        .publicId(imgReq.getPublicId())
                        .isPrimary(Boolean.TRUE.equals(imgReq.getIsPrimary()))
                        .build();
                product.addImage(image);
            }
        }

        if (request.getVariants() != null) {
            for (ProductRequest.ProductVariantRequest varReq : request.getVariants()) {
                if (variantRepository.existsBySku(varReq.getSku())) {
                    throw new ApiException(HttpStatus.CONFLICT, "SKU_ALREADY_EXISTS", "Variant SKU '" + varReq.getSku() + "' already exists");
                }
                ProductVariant variant = ProductVariant.builder()
                        .sku(varReq.getSku())
                        .size(varReq.getSize())
                        .color(varReq.getColor())
                        .stock(varReq.getStock())
                        .build();
                product.addVariant(variant);
            }
        }

        Product saved = productRepository.save(product);
        return mapToDto(saved);
    }

    @Transactional
    public ProductDto updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        product.setCategory(category);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setGender(request.getGender());
        product.setStyle(request.getStyle());
        product.setColor(request.getColor());
        product.setMaterial(request.getMaterial());
        product.setSeason(request.getSeason());
        product.setOccasion(request.getOccasion());
        product.setFit(request.getFit());
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }

        Product updated = productRepository.save(product);
        return mapToDto(updated);
    }

    @Transactional
    public MessageResponse deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        product.setActive(false);
        productRepository.save(product);
        return new MessageResponse("Product deactivated successfully");
    }

    public ProductDto mapToDto(Product product) {
        String primaryImageUrl = product.getImages().stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(product.getImages().isEmpty() ? null : product.getImages().get(0).getImageUrl());

        return ProductDto.builder()
                .id(product.getId())
                .categoryId(product.getCategory().getId())
                .categoryName(product.getCategory().getName())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .gender(product.getGender())
                .style(product.getStyle())
                .color(product.getColor())
                .material(product.getMaterial())
                .season(product.getSeason())
                .occasion(product.getOccasion())
                .fit(product.getFit())
                .active(product.getActive())
                .primaryImageUrl(primaryImageUrl)
                .images(product.getImages().stream().map(img -> ProductImageDto.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .publicId(img.getPublicId())
                        .isPrimary(img.getIsPrimary())
                        .build()).collect(Collectors.toList()))
                .variants(product.getVariants().stream().map(var -> ProductVariantDto.builder()
                        .id(var.getId())
                        .sku(var.getSku())
                        .size(var.getSize())
                        .color(var.getColor())
                        .stock(var.getStock())
                        .build()).collect(Collectors.toList()))
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
