package com.fundbridge.loanmanagementservice.integration.wallet.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record WalletSummaryResponse(
        Long accountId,
        Long userId,
        String currency,
        BigDecimal balance,
        BigDecimal held,
        String status,
        Instant updatedAt
) {
}
