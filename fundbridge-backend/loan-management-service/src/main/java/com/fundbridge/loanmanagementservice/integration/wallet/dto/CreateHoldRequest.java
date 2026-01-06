package com.fundbridge.loanmanagementservice.integration.wallet.dto;

import java.math.BigDecimal;

public record CreateHoldRequest(
        Long accountId,
        BigDecimal amount,
        String currency,
        String reason,
        String referenceType,
        String referenceId,
        String idempotencyKey
) {
}
