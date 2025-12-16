package com.fundbridge.loanmanagementservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateFundingRequest(
        @NotNull(message = "Loan id is required")
        Long loanId,
        Long lenderId,
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "1.00", message = "Amount must be positive")
        BigDecimal amount,
        String idempotencyKey,
        String walletTxRef
) {
}
