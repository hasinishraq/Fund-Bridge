package com.fundbridge.notificationservice.dto;

import java.time.Instant;

public record NotificationPreferenceResponse(
        Long userId,
        boolean emailEnabled,
        boolean smsEnabled,
        boolean inappEnabled,
        Instant updatedAt
) {
}
