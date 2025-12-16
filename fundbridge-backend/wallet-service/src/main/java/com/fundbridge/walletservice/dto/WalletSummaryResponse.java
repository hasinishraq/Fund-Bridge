package com.fundbridge.walletservice.dto;

import com.fundbridge.walletservice.entity.WalletStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record WalletSummaryResponse(
        Long accountId,
        Long userId,
        String currency,
        BigDecimal balance,
        BigDecimal held,
        WalletStatus status,
        Instant updatedAt
) {
}
