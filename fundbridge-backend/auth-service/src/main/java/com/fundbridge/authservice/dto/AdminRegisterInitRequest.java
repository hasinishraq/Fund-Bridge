package com.fundbridge.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminRegisterInitRequest(
        @NotBlank(message = "Name is required")
        String name,

        @Email(message = "Provide a valid email")
        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters long")
        String password,

        @NotBlank(message = "Admin registration secret is required")
        String adminSecret,

        @Size(max = 4096, message = "Captcha token is invalid")
        String captchaToken
) {
}
