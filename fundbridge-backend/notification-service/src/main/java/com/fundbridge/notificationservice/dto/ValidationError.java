package com.fundbridge.notificationservice.dto;

public record ValidationError(
        String field,
        String message
) {
}
