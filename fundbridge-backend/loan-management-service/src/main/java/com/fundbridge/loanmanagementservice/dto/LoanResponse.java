package com.fundbridge.loanmanagementservice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

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
        Instant closedAt,
        BigDecimal pledgedAmount,
        BigDecimal capturedAmount,
        Integer installmentsPaid,
        Integer installmentsTotal,
        LocalDate nextDueDate,
        BigDecimal nextDueAmount,
        Integer creditScore,
        String creditGrade,
        Instant creditScoreUpdatedAt
) {
}
