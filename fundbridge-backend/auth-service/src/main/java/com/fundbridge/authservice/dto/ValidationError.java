package com.fundbridge.authservice.dto;

public record ValidationError(
        String field,
        String message
) {
}
