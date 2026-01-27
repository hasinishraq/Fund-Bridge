package com.fundbridge.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AdminRegisterRequest(
        @NotBlank(message = "Name is required")
        String name,

        @Email(message = "Provide a valid email")
        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "Password is required")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{8,}$",
                message =
                        "Password must be at least 8 characters and include at least one letter, one number, and one special character"
        )
        String password,

        @NotBlank(message = "Admin registration secret is required")
        String adminSecret,

        @NotBlank(message = "OTP is required")
        String otp
) {
}
