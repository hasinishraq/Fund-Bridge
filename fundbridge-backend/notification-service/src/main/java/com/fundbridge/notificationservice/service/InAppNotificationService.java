package com.fundbridge.notificationservice.service;

import com.fundbridge.notificationservice.dto.InAppNotificationResponse;
import com.fundbridge.notificationservice.entity.InAppNotification;
import com.fundbridge.notificationservice.exception.ResourceNotFoundException;
import com.fundbridge.notificationservice.mapper.NotificationMapper;
import com.fundbridge.notificationservice.repository.InAppNotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class InAppNotificationService {

    private final InAppNotificationRepository inAppNotificationRepository;

    public InAppNotificationService(InAppNotificationRepository inAppNotificationRepository) {
        this.inAppNotificationRepository = inAppNotificationRepository;
    }

    @Transactional
    public InAppNotification createNotification(Long userId,
                                                 String templateKey,
                                                 String title,
                                                 String body,
                                                 String dataJson) {
        InAppNotification notification = new InAppNotification();
        notification.setUserId(userId);
        notification.setTemplateKey(templateKey);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setDataJson(dataJson);
        return inAppNotificationRepository.save(notification);
    }

    public List<InAppNotificationResponse> listNotifications(Long userId, boolean unreadOnly) {
        List<InAppNotification> notifications = unreadOnly
                ? inAppNotificationRepository.findByUserIdAndReadAtIsNullAndDeletedAtIsNullOrderByCreatedAtDesc(userId)
                : inAppNotificationRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId);
        return notifications.stream()
                .map(NotificationMapper::toInAppResponse)
                .toList();
    }

    @Transactional
    public InAppNotificationResponse markRead(Long userId, Long notificationId) {
        InAppNotification notification = inAppNotificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }
        return NotificationMapper.toInAppResponse(notification);
    }

    @Transactional
    public void deleteNotification(Long userId, Long notificationId) {
        InAppNotification notification = inAppNotificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (notification.getDeletedAt() == null) {
            notification.setDeletedAt(Instant.now());
        }
    }
}
