package com.expensetracker.controllers;

import com.expensetracker.dtos.UserResponse;
import com.expensetracker.dtos.UserUpdateRequest;
import com.expensetracker.entities.User;
import com.expensetracker.exceptions.ResourceNotFoundException;
import com.expensetracker.repositories.UserRepository;
import com.expensetracker.services.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody UserUpdateRequest request,
            Principal principal,
            HttpServletRequest servletRequest) {
        
        String ipAddress = getClientIp(servletRequest);
        log.info("Updating profile details for user: {} from IP: {}", principal.getName(), ipAddress);
        
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + principal.getName()));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setGender(request.getGender());
        user.setPreferredCurrency(request.getPreferredCurrency());
        user.setPreferredLanguage(request.getPreferredLanguage());
        user.setTimezone(request.getTimezone());
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl());
        }

        User updatedUser = userRepository.save(user);

        auditLogService.log(updatedUser, "UPDATE_PROFILE", 
                "Updated profile details and user preferences (Currency, Language, Timezone)", 
                ipAddress);

        return ResponseEntity.ok(mapToResponse(updatedUser));
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .profileImageUrl(user.getProfileImageUrl())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .preferredCurrency(user.getPreferredCurrency())
                .preferredLanguage(user.getPreferredLanguage())
                .timezone(user.getTimezone())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .emailVerified(user.getEmailVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
