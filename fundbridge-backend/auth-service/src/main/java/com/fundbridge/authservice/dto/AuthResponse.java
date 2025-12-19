package com.fundbridge.authservice.dto;

public record AuthResponse(
        String token,
        String refreshToken,
        UserResponse user
) {
}
