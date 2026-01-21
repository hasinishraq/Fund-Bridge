package com.fundbridge.adminservice.dto;

import java.time.Instant;

public record AdminAuditLogResponse(
        Long id,
        Long actorUserId,
        String serviceName,
        String eventType,
        String eventRef,
        String details,
        Instant createdAt
) {
}
