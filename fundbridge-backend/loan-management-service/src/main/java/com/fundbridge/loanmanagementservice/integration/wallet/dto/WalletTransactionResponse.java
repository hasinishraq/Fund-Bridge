package com.fundbridge.loanmanagementservice.integration.wallet.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record WalletTransactionResponse(
        Long id,
        String txRef,
        String type,
        String status,
        BigDecimal amount,
        String currency,
        Long fromAccountId,
        Long toAccountId,
        String referenceType,
        String referenceId,
        String failureReason,
        Instant createdAt,
        Instant postedAt
) {
}
