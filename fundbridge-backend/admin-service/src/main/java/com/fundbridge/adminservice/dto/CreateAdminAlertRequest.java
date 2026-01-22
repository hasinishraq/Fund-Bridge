package com.fundbridge.adminservice.dto;

import com.fundbridge.adminservice.entity.AdminAlertSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateAdminAlertRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 160, message = "Title must be at most 160 characters")
        String title,
        @Size(max = 280, message = "Detail must be at most 280 characters")
        String detail,
        @NotNull(message = "Severity is required")
        AdminAlertSeverity severity,
        @Size(max = 60, message = "Action label must be at most 60 characters")
        String actionLabel,
        Instant occurredAt
) {
}
