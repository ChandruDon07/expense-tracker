package com.expensetracker.dtos;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String tokenType;
    private UserResponse user;
}
// Note: tokenType is usually "Bearer"
