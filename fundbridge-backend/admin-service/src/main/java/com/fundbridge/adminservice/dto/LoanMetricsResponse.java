package com.fundbridge.adminservice.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record LoanMetricsResponse(
        BigDecimal totalOutstandingLoans,
        BigDecimal todaysDisbursements,
        BigDecimal dueTodayAmount,
        BigDecimal overdueAmount,
        BigDecimal defaultRate30d,
        Instant generatedAt
) {
}
