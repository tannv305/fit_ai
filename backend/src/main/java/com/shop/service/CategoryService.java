package com.shop.service;

import com.shop.dto.request.CategoryRequest;
import com.shop.dto.response.CategoryDto;
import com.shop.dto.response.MessageResponse;
import com.shop.entity.Category;
import com.shop.exception.ApiException;
import com.shop.exception.ResourceNotFoundException;
import com.shop.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDto getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return mapToDto(category);
    }

    @Transactional
    public CategoryDto createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new ApiException(HttpStatus.CONFLICT, "CATEGORY_ALREADY_EXISTS", "Category name already exists");
        }

        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        Category saved = categoryRepository.save(category);
        return mapToDto(saved);
    }

    @Transactional
    public CategoryDto updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        if (!category.getName().equalsIgnoreCase(request.getName()) && categoryRepository.existsByName(request.getName())) {
            throw new ApiException(HttpStatus.CONFLICT, "CATEGORY_ALREADY_EXISTS", "Category name already exists");
        }

        category.setName(request.getName());
        category.setDescription(request.getDescription());

        Category updated = categoryRepository.save(category);
        return mapToDto(updated);
    }

    @Transactional
    public MessageResponse deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        categoryRepository.delete(category);
        return new MessageResponse("Category deleted successfully");
    }

    public CategoryDto mapToDto(Category category) {
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .createdAt(category.getCreatedAt())
                .build();
    }
}
