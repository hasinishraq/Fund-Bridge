package com.fundbridge.adminservice.dto;

import com.fundbridge.adminservice.entity.AdminAlertSeverity;
import com.fundbridge.adminservice.entity.AdminAlertStatus;

import java.time.Instant;

public record AdminAlertResponse(
        Long id,
        String title,
        String detail,
        AdminAlertSeverity severity,
        AdminAlertStatus status,
        String actionLabel,
        Instant createdAt,
        Instant resolvedAt
) {
}
