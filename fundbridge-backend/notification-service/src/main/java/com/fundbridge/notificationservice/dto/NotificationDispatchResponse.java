package com.fundbridge.notificationservice.dto;

import com.fundbridge.notificationservice.entity.NotificationChannel;

import java.util.List;

public record NotificationDispatchResponse(
        List<NotificationOutboxResponse> outbox,
        List<NotificationChannel> skippedChannels
) {
}
