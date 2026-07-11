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
public class TransactionRequest {

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Double amount;

    @NotBlank(message = "Transaction type is required")
    private String type; // INCOME, EXPENSE, TRANSFER

    private String description;

    @NotNull(message = "Transaction date is required")
    private LocalDate transactionDate;

    private Long categoryId; // can be null for Transfer

    @NotNull(message = "Account ID is required")
    private Long accountId;

    private Long transferToAccountId; // only for TRANSFER type

    private String receiptUrl;
}
