package com.fundbridge.adminservice.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record WalletMetricsResponse(
        BigDecimal inflowToday,
        BigDecimal outflowToday,
        long failedPaymentsCount,
        long webhookFailuresCount,
        String currency,
        Instant from,
        Instant to
) {
}
