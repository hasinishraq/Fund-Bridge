package com.fundbridge.loanmanagementservice.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record LoanApplicationResponse(
        String applicationId,
        String status,
        BigDecimal estimatedEmi,
        int creditScore,
        Instant createdAt
) {
}
