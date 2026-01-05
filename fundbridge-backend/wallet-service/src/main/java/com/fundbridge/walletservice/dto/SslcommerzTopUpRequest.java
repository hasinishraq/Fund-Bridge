package com.fundbridge.walletservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SslcommerzTopUpRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "10.00", message = "Minimum top up is 10.00")
        BigDecimal amount,
        String currency,
        @NotNull(message = "User ID is required")
        Long userId,
        String idempotencyKey,
        String referenceId,
        String customerName,
        String customerEmail,
        String customerPhone
) {
}
