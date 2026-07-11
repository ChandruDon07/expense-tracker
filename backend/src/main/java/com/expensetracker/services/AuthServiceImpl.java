package com.expensetracker.services;

import com.expensetracker.dtos.AuthResponse;
import com.expensetracker.dtos.LoginRequest;
import com.expensetracker.dtos.RegisterRequest;
import com.expensetracker.dtos.UserResponse;
import com.expensetracker.entities.*;
import com.expensetracker.exceptions.BadRequestException;
import com.expensetracker.exceptions.ResourceNotFoundException;
import com.expensetracker.exceptions.UnauthorizedException;
import com.expensetracker.mappers.UserMapper;
import com.expensetracker.repositories.AuditLogRepository;
import com.expensetracker.repositories.UserRepository;
import com.expensetracker.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress) {
        String cleanEmail = request.getEmail().toLowerCase().trim();
        log.info("Processing user registration for email: {}", cleanEmail);

        if (userRepository.existsByEmail(cleanEmail)) {
            log.warn("Registration failed - email already in use: {}", cleanEmail);
            throw new BadRequestException("Email address is already in use");
        }

        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        // Ensure standard fields are populated
        user.setRole(Role.ROLE_USER);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setEmailVerified(false);

        User savedUser = userRepository.save(user);
        log.debug("User successfully saved to database with ID: {}", savedUser.getId());

        // Create JWT Token
        String token = tokenProvider.generateToken(savedUser.getEmail());

        // Audit Trail
        AuditLog auditLog = AuditLog.builder()
                .user(savedUser)
                .action("USER_REGISTRATION")
                .details("Registered user account for email " + savedUser.getEmail())
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(auditLog);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(userMapper.toResponse(savedUser))
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress) {
        String cleanEmail = request.getEmail().toLowerCase().trim();
        log.info("Processing login request for email: {}", cleanEmail);

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(cleanEmail, request.getPassword())
            );

            User user = userRepository.findByEmail(cleanEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("User profile not found after authentication"));

            if (user.getAccountStatus() == AccountStatus.SUSPENDED) {
                log.warn("Login failed - account suspended: {}", cleanEmail);
                throw new UnauthorizedException("Your account has been suspended. Please contact support.");
            }

            // Create JWT Token
            String token = tokenProvider.generateToken(user.getEmail());

            // Audit Trail
            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action("USER_LOGIN")
                    .details("Successfully logged in")
                    .ipAddress(ipAddress)
                    .build();
            auditLogRepository.save(auditLog);

            log.info("User {} successfully authenticated", cleanEmail);

            return AuthResponse.builder()
                    .token(token)
                    .tokenType("Bearer")
                    .user(userMapper.toResponse(user))
                    .build();

        } catch (BadCredentialsException ex) {
            log.warn("Login failed - bad credentials for email: {}", cleanEmail);
            throw new UnauthorizedException("Invalid email or password");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        log.debug("Fetching current user info for email: {}", email);
        User user = userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for email: " + email));
        return userMapper.toResponse(user);
    }
}
