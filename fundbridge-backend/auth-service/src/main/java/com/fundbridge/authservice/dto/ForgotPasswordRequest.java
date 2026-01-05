package com.fundbridge.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ForgotPasswordRequest(
        @Email(message = "Provide a valid email")
        @NotBlank(message = "Email is required")
        String email,

        @Size(max = 4096, message = "Captcha token is invalid")
        String captchaToken
) {
}
