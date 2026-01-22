package com.fundbridge.adminservice.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminRiskEventResponse(
        Long id,
        String type,
        String status,
        String userId,
        String userName,
        String loanId,
        String walletId,
        String gateway,
        String referenceId,
        BigDecimal amount,
        Integer riskScore,
        String channel,
        Instant createdAt,
        Instant updatedAt
) {
}
