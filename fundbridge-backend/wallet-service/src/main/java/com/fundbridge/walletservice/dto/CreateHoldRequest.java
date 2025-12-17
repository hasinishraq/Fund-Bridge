package com.fundbridge.walletservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateHoldRequest(
        @NotNull(message = "Account is required")
        Long accountId,
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,
        String currency,
        @NotBlank(message = "Reason is required")
        String reason,
        String referenceType,
        String referenceId,
        String idempotencyKey
) {
}
