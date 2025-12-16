package com.fundbridge.loanmanagementservice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record InstallmentResponse(
        Long id,
        int installmentNo,
        LocalDate dueDate,
        BigDecimal principalAmount,
        BigDecimal interestAmount,
        BigDecimal totalAmount,
        String status,
        Instant paidAt,
        String walletTxRef
) {
}
