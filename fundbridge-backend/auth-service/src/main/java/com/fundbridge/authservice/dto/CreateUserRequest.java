package com.fundbridge.authservice.dto;

import com.fundbridge.authservice.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "Name is required")
        String name,
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email,
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 120, message = "Password must be between 8 and 120 characters")
        String password,
        UserRole role
) {
}
