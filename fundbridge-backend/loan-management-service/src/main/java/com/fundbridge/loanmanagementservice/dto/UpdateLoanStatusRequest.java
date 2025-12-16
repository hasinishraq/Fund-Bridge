package com.fundbridge.loanmanagementservice.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateLoanStatusRequest(
        @NotBlank(message = "Status is required")
        String status
) {
}
