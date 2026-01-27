package com.fundbridge.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PasswordResetRequest(
        @Email(message = "Provide a valid email")
        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "OTP is required")
        String otp,

        @NotBlank(message = "New password is required")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{8,}$",
                message =
                        "Password must be at least 8 characters and include at least one letter, one number, and one special character"
        )
        String newPassword
) {
}
