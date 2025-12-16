package com.fundbridge.loanmanagementservice.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record FundingResponse(
        Long id,
        Long loanId,
        Long lenderId,
        BigDecimal amount,
        String status,
        String idempotencyKey,
        String walletTxRef,
        Instant createdAt,
        Instant capturedAt
) {
}
