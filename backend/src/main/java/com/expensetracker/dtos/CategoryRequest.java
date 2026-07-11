package com.expensetracker.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 50, message = "Category name must be under 50 characters")
    private String name;

    @NotBlank(message = "Category type is required")
    private String type; // INCOME, EXPENSE

    @Size(max = 20, message = "Color code must be under 20 characters")
    private String color; // Hex string

    @Size(max = 50, message = "Icon name must be under 50 characters")
    private String icon; // Icon name
}
