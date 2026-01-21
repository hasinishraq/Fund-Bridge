package com.fundbridge.adminservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAdminAuditLogRequest(
        Long actorUserId,
        @NotBlank(message = "Service name is required")
        @Size(max = 40, message = "Service name must be at most 40 characters")
        String serviceName,
        @NotBlank(message = "Event type is required")
        @Size(max = 60, message = "Event type must be at most 60 characters")
        String eventType,
        @Size(max = 120, message = "Event reference must be at most 120 characters")
        String eventRef,
        @Size(max = 1024, message = "Details must be at most 1024 characters")
        String details
) {
}
