package com.fundbridge.userservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 1, max = 255, message = "Name must be between 1 and 255 characters")
        String name,
        @Email(message = "Email must be valid")
        String email,
        @Size(min = 8, max = 120, message = "Password must be between 8 and 120 characters")
        String password
) {
}
