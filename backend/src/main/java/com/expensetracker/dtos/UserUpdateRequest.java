package com.expensetracker.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpdateRequest {

    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must be under 50 characters")
    private String firstName;

    @Size(max = 50, message = "Last name must be under 50 characters")
    private String lastName;

    @Size(max = 20, message = "Phone number must be under 20 characters")
    private String phoneNumber;

    private LocalDate dateOfBirth;

    @Size(max = 20, message = "Gender must be under 20 characters")
    private String gender;

    @NotBlank(message = "Preferred currency is required")
    @Size(max = 10, message = "Preferred currency must be under 10 characters")
    private String preferredCurrency;

    @NotBlank(message = "Preferred language is required")
    @Size(max = 10, message = "Preferred language must be under 10 characters")
    private String preferredLanguage;

    @NotBlank(message = "Timezone is required")
    @Size(max = 50, message = "Timezone must be under 50 characters")
    private String timezone;

    private String profileImageUrl;
}
