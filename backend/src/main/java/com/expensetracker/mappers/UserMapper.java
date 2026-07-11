package com.expensetracker.mappers;

import com.expensetracker.dtos.RegisterRequest;
import com.expensetracker.dtos.UserResponse;
import com.expensetracker.entities.AccountStatus;
import com.expensetracker.entities.Role;
import com.expensetracker.entities.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntity(RegisterRequest request) {
        if (request == null) {
            return null;
        }

        return User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail().toLowerCase().trim())
                .phoneNumber(request.getPhoneNumber())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .preferredCurrency(request.getPreferredCurrency() != null ? request.getPreferredCurrency() : "USD")
                .preferredLanguage(request.getPreferredLanguage() != null ? request.getPreferredLanguage() : "en")
                .timezone(request.getTimezone() != null ? request.getTimezone() : "UTC")
                .role(Role.ROLE_USER) // Default role
                .accountStatus(AccountStatus.ACTIVE) // Default active
                .emailVerified(false)
                .build();
    }

    public UserResponse toResponse(User entity) {
        if (entity == null) {
            return null;
        }

        return UserResponse.builder()
                .id(entity.getId())
                .firstName(entity.getFirstName())
                .lastName(entity.getLastName())
                .email(entity.getEmail())
                .phoneNumber(entity.getPhoneNumber())
                .profileImageUrl(entity.getProfileImageUrl())
                .dateOfBirth(entity.getDateOfBirth())
                .gender(entity.getGender())
                .preferredCurrency(entity.getPreferredCurrency())
                .preferredLanguage(entity.getPreferredLanguage())
                .timezone(entity.getTimezone())
                .role(entity.getRole())
                .accountStatus(entity.getAccountStatus())
                .emailVerified(entity.getEmailVerified())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
