package com.fundbridge.walletservice.dto;

public record ValidationError(
        String field,
        String message
) {
}
