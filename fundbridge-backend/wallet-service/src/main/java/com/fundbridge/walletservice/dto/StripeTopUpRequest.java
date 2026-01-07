package com.fundbridge.walletservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record StripeTopUpRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.50", message = "Minimum top up is 0.50")
        BigDecimal amount,
        String currency,
        @NotNull(message = "User ID is required")
        Long userId,
        String idempotencyKey,
        String referenceId,
        String metadata
) {
}
