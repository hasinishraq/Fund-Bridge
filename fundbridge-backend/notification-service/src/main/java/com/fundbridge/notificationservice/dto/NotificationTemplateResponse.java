package com.fundbridge.notificationservice.dto;

import com.fundbridge.notificationservice.entity.NotificationChannel;

import java.time.Instant;

public record NotificationTemplateResponse(
        Long id,
        String templateKey,
        NotificationChannel channel,
        String subject,
        String body,
        int version,
        boolean active,
        Instant createdAt
) {
}
