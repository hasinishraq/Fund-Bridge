package com.fundbridge.authservice.dto;

public record AuthResponse(
        String token,
        UserResponse user
) {
}
