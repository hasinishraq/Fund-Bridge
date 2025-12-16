package com.fundbridge.loanmanagementservice.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record LoanResponse(
        Long id,
        Long borrowerId,
        BigDecimal amount,
        String currency,
        BigDecimal interestRatePercent,
        int tenureMonths,
        String purpose,
        String status,
        Instant createdAt,
        Instant updatedAt,
        Instant approvedAt,
        Instant activatedAt,
        Instant closedAt
) {
}
