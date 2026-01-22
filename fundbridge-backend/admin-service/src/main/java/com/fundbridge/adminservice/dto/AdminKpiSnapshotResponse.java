package com.fundbridge.adminservice.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminKpiSnapshotResponse(
        Long id,
        BigDecimal totalOutstandingLoans,
        BigDecimal todaysDisbursements,
        BigDecimal dueTodayAmount,
        BigDecimal overdueAmount,
        BigDecimal defaultRate30d,
        BigDecimal walletInflowToday,
        BigDecimal walletOutflowToday,
        Integer failedPaymentsCount,
        Integer webhookFailuresCount,
        Integer suspiciousActivityFlags,
        Instant createdAt
) {
}
