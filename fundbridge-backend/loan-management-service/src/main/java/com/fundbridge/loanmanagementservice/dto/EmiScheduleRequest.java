package com.fundbridge.loanmanagementservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record EmiScheduleRequest(
        @NotNull(message = "Principal is required")
        @DecimalMin(value = "1000.00", message = "Principal must be at least 1000")
        BigDecimal principal,
        @NotNull(message = "Annual interest rate is required")
        @DecimalMin(value = "0.1", message = "Annual interest rate must be positive")
        BigDecimal annualRatePercent,
        @Min(value = 1, message = "Term must be at least 1 month")
        int termMonths
) {
}
