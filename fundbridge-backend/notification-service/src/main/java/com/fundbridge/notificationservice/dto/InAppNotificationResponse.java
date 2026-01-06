package com.fundbridge.notificationservice.dto;

import java.time.Instant;

public record InAppNotificationResponse(
        Long id,
        Long userId,
        String templateKey,
        String title,
        String body,
        String dataJson,
        Instant createdAt,
        Instant readAt,
        Instant deletedAt
) {
}
