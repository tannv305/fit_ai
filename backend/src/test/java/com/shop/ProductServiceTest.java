package com.shop;

import com.shop.dto.request.ProductRequest;
import com.shop.dto.response.ProductDto;
import com.shop.entity.Category;
import com.shop.entity.Product;
import com.shop.repository.CategoryRepository;
import com.shop.repository.ProductRepository;
import com.shop.repository.ProductVariantRepository;
import com.shop.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @InjectMocks
    private ProductService productService;

    private Category category;
    private ProductRequest productRequest;

    @BeforeEach
    void setUp() {
        category = Category.builder().id(1L).name("Áo").description("Các loại áo").build();

        productRequest = new ProductRequest();
        productRequest.setCategoryId(1L);
        productRequest.setName("Áo Sơ Mi Trắng");
        productRequest.setDescription("Mô tả áo sơ mi");
        productRequest.setPrice(new BigDecimal("350000.00"));
        productRequest.setGender("MALE");
        productRequest.setStyle("FORMAL");
    }

    @Test
    void createProduct_Success() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setId(10L);
            return p;
        });

        ProductDto result = productService.createProduct(productRequest);

        assertNotNull(result);
        assertEquals("Áo Sơ Mi Trắng", result.getName());
        assertEquals(new BigDecimal("350000.00"), result.getPrice());
        verify(productRepository, times(1)).save(any(Product.class));
    }
}
