package com.expensetracker.dtos;

import com.expensetracker.entities.AccountStatus;
import com.expensetracker.entities.Role;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String profileImageUrl;
    private LocalDate dateOfBirth;
    private String gender;
    private String preferredCurrency;
    private String preferredLanguage;
    private String timezone;
    private Role role;
    private AccountStatus accountStatus;
    private Boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
