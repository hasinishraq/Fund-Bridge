package com.fundbridge.adminservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateAdminApprovalRequest(
        @NotBlank(message = "Approval type is required")
        @Size(max = 40, message = "Approval type must be at most 40 characters")
        String type,
        @NotBlank(message = "Status is required")
        @Size(max = 60, message = "Status must be at most 60 characters")
        String status,
        @NotBlank(message = "User id is required")
        @Size(max = 64, message = "User id must be at most 64 characters")
        String userId,
        @NotBlank(message = "User name is required")
        @Size(max = 140, message = "User name must be at most 140 characters")
        String userName,
        @Min(value = 0, message = "Risk score must be at least 0")
        @Max(value = 100, message = "Risk score must be at most 100")
        Integer riskScore,
        BigDecimal amount,
        @Size(max = 64, message = "Loan id must be at most 64 characters")
        String loanId,
        @Size(max = 80, message = "Queue must be at most 80 characters")
        String queue,
        Instant requestedAt
) {
}
