package com.expensetracker.dtos;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponse {
    private Long id;
    private Double amount;
    private String type;
    private String description;
    private LocalDate transactionDate;
    private CategoryResponse category;
    private AccountResponse account;
    private AccountResponse transferToAccount;
    private String receiptUrl;
    private LocalDateTime createdAt;
}
