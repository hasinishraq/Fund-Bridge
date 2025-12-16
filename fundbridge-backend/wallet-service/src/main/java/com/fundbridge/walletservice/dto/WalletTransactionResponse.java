package com.fundbridge.walletservice.dto;

import com.fundbridge.walletservice.entity.TransactionStatus;
import com.fundbridge.walletservice.entity.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;

public record WalletTransactionResponse(
        Long id,
        String idempotencyKey,
        TransactionType type,
        TransactionStatus status,
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
