package com.fundbridge.loanmanagementservice.integration.wallet.dto;

import java.math.BigDecimal;

public record TransferRequest(
        Long fromAccountId,
        Long toAccountId,
        BigDecimal amount,
        String currency,
        String referenceType,
        String referenceId,
        String idempotencyKey,
        String metadata
) {
}
