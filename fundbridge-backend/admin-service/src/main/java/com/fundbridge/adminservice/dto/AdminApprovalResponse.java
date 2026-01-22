package com.fundbridge.adminservice.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminApprovalResponse(
        Long id,
        String type,
        String status,
        String userId,
        String userName,
        Integer riskScore,
        BigDecimal amount,
        String loanId,
        String queue,
        Instant requestedAt,
        Instant updatedAt
) {
}
