package com.fundbridge.kycservice.dto;

public record ApiError(
        String message,
        int status
) {
}
