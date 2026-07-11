package com.expensetracker.services;

import com.expensetracker.dtos.AuthResponse;
import com.expensetracker.dtos.LoginRequest;
import com.expensetracker.dtos.RegisterRequest;
import com.expensetracker.dtos.UserResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request, String ipAddress);
    AuthResponse login(LoginRequest request, String ipAddress);
    UserResponse getCurrentUser(String email);
}
