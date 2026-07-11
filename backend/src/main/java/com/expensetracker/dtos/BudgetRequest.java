package com.expensetracker.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BudgetRequest {

    @NotNull(message = "Limit amount is required")
    @Positive(message = "Limit amount must be positive")
    private Double limitAmount;

    @NotBlank(message = "Period is required")
    private String period; // MONTHLY, YEARLY

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private Long categoryId; // Nullable (represents global overall budget)
}
