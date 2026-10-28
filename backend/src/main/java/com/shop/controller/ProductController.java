package com.shop.controller;

import com.shop.dto.request.ProductSearchCriteria;
import com.shop.dto.response.ProductDto;
import com.shop.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<ProductDto>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String style,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int sizeParam,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        ProductSearchCriteria criteria = new ProductSearchCriteria();
        criteria.setSearch(search);
        criteria.setCategoryId(categoryId);
        criteria.setGender(gender);
        criteria.setStyle(style);
        criteria.setColor(color);
        criteria.setSize(size);
        criteria.setMinPrice(minPrice);
        criteria.setMaxPrice(maxPrice);
        criteria.setActiveOnly(true);

        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sortObj = Sort.by(direction, sortParams[0]);

        Pageable pageable = PageRequest.of(page, sizeParam, sortObj);
        Page<ProductDto> products = productService.getProducts(criteria, pageable);

        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }
}
