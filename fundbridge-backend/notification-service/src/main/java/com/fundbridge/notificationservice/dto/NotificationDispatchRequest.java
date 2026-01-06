package com.fundbridge.notificationservice.dto;

import com.fundbridge.notificationservice.entity.NotificationChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record NotificationDispatchRequest(
        @NotNull(message = "User ID is required")
        Long userId,
        @NotBlank(message = "Template key is required")
        String templateKey,
        @NotNull(message = "Payload is required")
        Map<String, Object> payload,
        List<NotificationChannel> channels,
        Instant scheduledAt,
        String idempotencyKey
) {
}
