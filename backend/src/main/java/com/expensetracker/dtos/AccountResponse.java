package com.expensetracker.dtos;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountResponse {
    private Long id;
    private String name;
    private String type;
    private Double balance;
    private String currency;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
