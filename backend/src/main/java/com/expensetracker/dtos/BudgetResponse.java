package com.expensetracker.dtos;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetResponse {
    private Long id;
    private Double limitAmount;
    private String period;
    private LocalDate startDate;
    private LocalDate endDate;
    private CategoryResponse category;
    private Double currentSpend; // dynamically computed
    private LocalDateTime createdAt;
}
