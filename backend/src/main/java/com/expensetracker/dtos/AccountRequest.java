package com.expensetracker.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountRequest {

    @NotBlank(message = "Account name is required")
    @Size(max = 50, message = "Account name must be under 50 characters")
    private String name;

    @NotBlank(message = "Account type is required")
    private String type; // SAVINGS, CHECKING, CREDIT_CARD, CASH

    @NotNull(message = "Initial balance is required")
    private Double balance;

    @NotBlank(message = "Currency is required")
    @Size(max = 10, message = "Currency must be under 10 characters")
    private String currency; // e.g. USD, EUR, INR
}
