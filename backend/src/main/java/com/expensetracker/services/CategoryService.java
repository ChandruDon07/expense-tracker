package com.expensetracker.services;

import com.expensetracker.dtos.CategoryRequest;
import com.expensetracker.dtos.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories(String email);
    CategoryResponse getCategoryById(Long id, String email);
    CategoryResponse createCategory(CategoryRequest request, String email, String ipAddress);
    CategoryResponse updateCategory(Long id, CategoryRequest request, String email, String ipAddress);
    void deleteCategory(Long id, String email, String ipAddress);
}
