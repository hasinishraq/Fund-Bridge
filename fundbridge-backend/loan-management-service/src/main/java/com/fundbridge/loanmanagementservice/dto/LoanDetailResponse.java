package com.fundbridge.loanmanagementservice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record LoanDetailResponse(
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
        Instant closedAt,
        List<FundingResponse> fundings,
        List<InstallmentResponse> installments,
        List<LoanEventResponse> events
) {
}
