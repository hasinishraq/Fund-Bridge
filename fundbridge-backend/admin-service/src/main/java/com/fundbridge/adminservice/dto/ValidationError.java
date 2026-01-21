package com.fundbridge.adminservice.dto;

public record ValidationError(
        String field,
        String message
) {
}
