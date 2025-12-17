package com.fundbridge.walletservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record WalletTopUpRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,
        String currency,
        @NotNull(message = "User ID is required")
        Long userId,
        String referenceType,
        String referenceId,
        String idempotencyKey,
        String metadata
) {
}
