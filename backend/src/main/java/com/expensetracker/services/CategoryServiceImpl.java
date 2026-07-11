package com.expensetracker.services;

import com.expensetracker.dtos.CategoryRequest;
import com.expensetracker.dtos.CategoryResponse;
import com.expensetracker.entities.Category;
import com.expensetracker.entities.User;
import com.expensetracker.exceptions.BadRequestException;
import com.expensetracker.exceptions.ResourceNotFoundException;
import com.expensetracker.repositories.CategoryRepository;
import com.expensetracker.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories(String email) {
        User user = getUserByEmail(email);
        return categoryRepository.findByUserIdOrSystem(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id, String email) {
        User user = getUserByEmail(email);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        // Ensure user owns custom category or it is system default
        if (category.getUser() != null && !category.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Category not found with ID: " + id);
        }

        return mapToResponse(category);
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request, String email, String ipAddress) {
        User user = getUserByEmail(email);

        // Check if custom category already exists for this user
        if (categoryRepository.existsByNameAndUserId(request.getName(), user.getId())) {
            throw new BadRequestException("A category with this name already exists");
        }

        Category category = Category.builder()
                .name(request.getName())
                .type(request.getType())
                .color(request.getColor())
                .icon(request.getIcon())
                .user(user)
                .build();
        Category savedCategory = categoryRepository.save(category);

        auditLogService.log(user, "CREATE_CATEGORY", 
                String.format("Created custom category: %s (Type: %s)", category.getName(), category.getType()), 
                ipAddress);

        return mapToResponse(savedCategory);
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request, String email, String ipAddress) {
        User user = getUserByEmail(email);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        if (category.getUser() == null) {
            throw new BadRequestException("Cannot modify system default categories");
        }

        if (!category.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Category not found with ID: " + id);
        }

        category.setName(request.getName());
        category.setType(request.getType());
        category.setColor(request.getColor());
        category.setIcon(request.getIcon());

        Category updatedCategory = categoryRepository.save(category);

        auditLogService.log(user, "UPDATE_CATEGORY", 
                String.format("Updated custom category ID %d: %s (Type: %s)", id, category.getName(), category.getType()), 
                ipAddress);

        return mapToResponse(updatedCategory);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id, String email, String ipAddress) {
        User user = getUserByEmail(email);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));

        if (category.getUser() == null) {
            throw new BadRequestException("Cannot delete system default categories");
        }

        if (!category.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Category not found with ID: " + id);
        }

        categoryRepository.delete(category);

        auditLogService.log(user, "DELETE_CATEGORY", 
                String.format("Deleted custom category ID %d: %s", id, category.getName()), 
                ipAddress);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .color(category.getColor())
                .icon(category.getIcon())
                .isSystem(category.getUser() == null)
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
