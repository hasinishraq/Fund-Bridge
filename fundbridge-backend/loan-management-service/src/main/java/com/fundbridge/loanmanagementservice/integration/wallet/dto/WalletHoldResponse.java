package com.fundbridge.loanmanagementservice.integration.wallet.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.Instant;

public record WalletHoldResponse(
        @JsonProperty("id")
        Long holdId,
        String holdRef,
        Long accountId,
        BigDecimal amount,
        String currency,
        String reason,
        String status,
        String referenceType,
        String referenceId,
        Instant createdAt,
        Instant updatedAt
) {
}
