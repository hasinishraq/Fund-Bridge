package com.fundbridge.adminservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateAdminRiskEventRequest(
        @NotBlank(message = "Event type is required")
        @Size(max = 120, message = "Event type must be at most 120 characters")
        String type,
        @NotBlank(message = "Status is required")
        @Size(max = 80, message = "Status must be at most 80 characters")
        String status,
        @Size(max = 64, message = "User id must be at most 64 characters")
        String userId,
        @Size(max = 140, message = "User name must be at most 140 characters")
        String userName,
        @Size(max = 64, message = "Loan id must be at most 64 characters")
        String loanId,
        @Size(max = 64, message = "Wallet id must be at most 64 characters")
        String walletId,
        @Size(max = 60, message = "Gateway must be at most 60 characters")
        String gateway,
        @Size(max = 140, message = "Reference id must be at most 140 characters")
        String referenceId,
        BigDecimal amount,
        @Min(value = 0, message = "Risk score must be at least 0")
        @Max(value = 100, message = "Risk score must be at most 100")
        Integer riskScore,
        @Size(max = 60, message = "Channel must be at most 60 characters")
        String channel,
        Instant occurredAt
) {
}
