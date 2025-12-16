package com.fundbridge.loanmanagementservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateLoanRequest(
        Long borrowerId,
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "1000.00", message = "Amount must be at least 1000")
        BigDecimal amount,
        @Min(value = 1, message = "Tenure must be at least 1 month")
        int tenureMonths,
        @NotBlank(message = "Purpose is required")
        String purpose,
        @DecimalMin(value = "0.1", inclusive = true, message = "Interest rate must be positive")
        BigDecimal interestRatePercent,
        String currency
) {
}
