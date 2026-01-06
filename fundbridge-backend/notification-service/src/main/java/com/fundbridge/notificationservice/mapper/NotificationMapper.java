package com.fundbridge.notificationservice.mapper;

import com.fundbridge.notificationservice.dto.InAppNotificationResponse;
import com.fundbridge.notificationservice.dto.NotificationDispatchResponse;
import com.fundbridge.notificationservice.dto.NotificationOutboxResponse;
import com.fundbridge.notificationservice.dto.NotificationPreferenceResponse;
import com.fundbridge.notificationservice.dto.NotificationTemplateResponse;
import com.fundbridge.notificationservice.entity.InAppNotification;
import com.fundbridge.notificationservice.entity.NotificationChannel;
import com.fundbridge.notificationservice.entity.NotificationOutbox;
import com.fundbridge.notificationservice.entity.NotificationPreference;
import com.fundbridge.notificationservice.entity.NotificationTemplate;

import java.util.List;

public final class NotificationMapper {

    private NotificationMapper() {
    }

    public static NotificationPreferenceResponse toPreferenceResponse(NotificationPreference preference) {
        return new NotificationPreferenceResponse(
                preference.getUserId(),
                preference.isEmailEnabled(),
                preference.isSmsEnabled(),
                preference.isInappEnabled(),
                preference.getUpdatedAt()
        );
    }

    public static NotificationTemplateResponse toTemplateResponse(NotificationTemplate template) {
        return new NotificationTemplateResponse(
                template.getId(),
                template.getTemplateKey(),
                template.getChannel(),
                template.getSubject(),
                template.getBody(),
                template.getVersion(),
                template.isActive(),
                template.getCreatedAt()
        );
    }

    public static NotificationOutboxResponse toOutboxResponse(NotificationOutbox outbox) {
        return new NotificationOutboxResponse(
                outbox.getId(),
                outbox.getUserId(),
                outbox.getChannel(),
                outbox.getTemplateKey(),
                outbox.getIdempotencyKey(),
                outbox.getStatus(),
                outbox.getAttempts(),
                outbox.getLastError(),
                outbox.getScheduledAt(),
                outbox.getLockedAt(),
                outbox.getSentAt(),
                outbox.getCreatedAt()
        );
    }

    public static InAppNotificationResponse toInAppResponse(InAppNotification notification) {
        return new InAppNotificationResponse(
                notification.getId(),
                notification.getUserId(),
                notification.getTemplateKey(),
                notification.getTitle(),
                notification.getBody(),
                notification.getDataJson(),
                notification.getCreatedAt(),
                notification.getReadAt(),
                notification.getDeletedAt()
        );
    }

    public static NotificationDispatchResponse toDispatchResponse(List<NotificationOutbox> outbox,
                                                                  List<NotificationChannel> skippedChannels) {
        List<NotificationOutboxResponse> outboxResponses = outbox.stream()
                .map(NotificationMapper::toOutboxResponse)
                .toList();
        return new NotificationDispatchResponse(outboxResponses, skippedChannels);
    }
}
