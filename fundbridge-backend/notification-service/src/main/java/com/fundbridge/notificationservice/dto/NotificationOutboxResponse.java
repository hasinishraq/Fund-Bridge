package com.fundbridge.notificationservice.dto;

import com.fundbridge.notificationservice.entity.NotificationChannel;
import com.fundbridge.notificationservice.entity.NotificationStatus;

import java.time.Instant;

public record NotificationOutboxResponse(
        Long id,
        Long userId,
        NotificationChannel channel,
        String templateKey,
        String idempotencyKey,
        NotificationStatus status,
        int attempts,
        String lastError,
        Instant scheduledAt,
        Instant lockedAt,
        Instant sentAt,
        Instant createdAt
) {
}
