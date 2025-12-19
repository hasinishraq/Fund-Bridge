package com.fundbridge.authservice.dto;

public record TokenPair(
        String accessToken,
        String refreshToken
) {
}
