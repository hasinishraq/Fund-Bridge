package com.fundbridge.authservice.kyc.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateApplicantRequest(
        @NotNull(message = "User id is required")
        Long userId,

        @NotBlank(message = "Full name is required")
        String fullName,

        @Email(message = "Provide a valid email")
        @NotBlank(message = "Email is required")
        String email
) {
}
