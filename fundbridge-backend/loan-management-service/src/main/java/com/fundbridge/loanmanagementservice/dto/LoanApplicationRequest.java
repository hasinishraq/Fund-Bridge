package com.fundbridge.loanmanagementservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record LoanApplicationRequest(
        @NotNull(message = "Borrower id is required")
        Long borrowerId,
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "1000.00", message = "Amount must be at least 1000")
        BigDecimal amount,
        @Min(value = 1, message = "Term must be at least 1 month")
        int termMonths,
        @NotBlank(message = "Purpose is required")
        String purpose
) {
}
