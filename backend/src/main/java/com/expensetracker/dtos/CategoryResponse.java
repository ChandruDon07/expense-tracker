package com.expensetracker.dtos;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private String type;
    private String color;
    private String icon;
    private boolean isSystem; // true if user is null
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
