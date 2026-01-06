package com.fundbridge.walletservice.integration.notification;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record NotificationDispatchRequest(
        Long userId,
        String templateKey,
        Map<String, Object> payload,
        List<String> channels,
        Instant scheduledAt,
        String idempotencyKey
) {
}
