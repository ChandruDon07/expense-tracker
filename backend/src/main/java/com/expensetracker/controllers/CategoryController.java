package com.expensetracker.controllers;

import com.expensetracker.dtos.CategoryRequest;
import com.expensetracker.dtos.CategoryResponse;
import com.expensetracker.services.CategoryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Slf4j
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategories(Principal principal) {
        log.info("Fetching categories for user: {}", principal.getName());
        return ResponseEntity.ok(categoryService.getAllCategories(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable Long id, Principal principal) {
        log.info("Fetching category ID {} for user: {}", id, principal.getName());
        return ResponseEntity.ok(categoryService.getCategoryById(id, principal.getName()));
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(
            @Valid @RequestBody CategoryRequest request, 
            Principal principal, 
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        log.info("Creating custom category: {} for user: {} from IP: {}", request.getName(), principal.getName(), ipAddress);
        CategoryResponse response = categoryService.createCategory(request, principal.getName(), ipAddress);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id, 
            @Valid @RequestBody CategoryRequest request, 
            Principal principal, 
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        log.info("Updating custom category ID {} for user: {} from IP: {}", id, principal.getName(), ipAddress);
        CategoryResponse response = categoryService.updateCategory(id, request, principal.getName(), ipAddress);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id, 
            Principal principal, 
            HttpServletRequest servletRequest) {
        String ipAddress = getClientIp(servletRequest);
        log.info("Deleting custom category ID {} for user: {} from IP: {}", id, principal.getName(), ipAddress);
        categoryService.deleteCategory(id, principal.getName(), ipAddress);
        return ResponseEntity.noContent().build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
