package com.fundbridge.walletservice.dto;

import com.fundbridge.walletservice.entity.HoldStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record WalletHoldResponse(
        Long id,
        String holdRef,
        Long accountId,
        BigDecimal amount,
        String currency,
        String reason,
        HoldStatus status,
        String referenceType,
        String referenceId,
        Instant createdAt,
        Instant updatedAt
) {
}
