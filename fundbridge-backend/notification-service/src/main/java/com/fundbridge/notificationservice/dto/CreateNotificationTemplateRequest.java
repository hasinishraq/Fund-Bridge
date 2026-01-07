package com.fundbridge.notificationservice.dto;

import com.fundbridge.notificationservice.entity.NotificationChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateNotificationTemplateRequest(
        @NotBlank(message = "Template key is required")
        String templateKey,
        @NotNull(message = "Channel is required")
        NotificationChannel channel,
        String subject,
        @NotBlank(message = "Body is required")
        String body,
        Integer version,
        Boolean active
) {
}
