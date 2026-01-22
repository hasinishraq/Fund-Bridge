package com.fundbridge.adminservice.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateAdminKpiSnapshotRequest(
        @NotNull(message = "Total outstanding loans is required")
        BigDecimal totalOutstandingLoans,
        @NotNull(message = "Today's disbursements is required")
        BigDecimal todaysDisbursements,
        @NotNull(message = "Due today amount is required")
        BigDecimal dueTodayAmount,
        @NotNull(message = "Overdue amount is required")
        BigDecimal overdueAmount,
        @NotNull(message = "Default rate 30d is required")
        BigDecimal defaultRate30d,
        @NotNull(message = "Wallet inflow today is required")
        BigDecimal walletInflowToday,
        @NotNull(message = "Wallet outflow today is required")
        BigDecimal walletOutflowToday,
        @NotNull(message = "Failed payments count is required")
        Integer failedPaymentsCount,
        @NotNull(message = "Webhook failures count is required")
        Integer webhookFailuresCount,
        @NotNull(message = "Suspicious activity flags count is required")
        Integer suspiciousActivityFlags
) {
}
