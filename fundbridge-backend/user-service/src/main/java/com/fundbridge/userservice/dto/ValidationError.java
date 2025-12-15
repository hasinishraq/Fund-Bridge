package com.fundbridge.userservice.dto;

public record ValidationError(
        String field,
        String message
) {
}
