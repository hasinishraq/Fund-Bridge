package com.fundbridge.notificationservice.service;

import com.fundbridge.notificationservice.dto.NotificationOutboxResponse;
import com.fundbridge.notificationservice.entity.NotificationChannel;
import com.fundbridge.notificationservice.entity.NotificationOutbox;
import com.fundbridge.notificationservice.entity.NotificationStatus;
import com.fundbridge.notificationservice.mapper.NotificationMapper;
import com.fundbridge.notificationservice.repository.NotificationOutboxRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class NotificationOutboxService {

    private final NotificationOutboxRepository outboxRepository;

    public NotificationOutboxService(NotificationOutboxRepository outboxRepository) {
        this.outboxRepository = outboxRepository;
    }

    public List<NotificationOutboxResponse> listOutbox(Long userId,
                                                       NotificationChannel channel,
                                                       NotificationStatus status) {
        List<NotificationOutbox> entries = outboxRepository.findAll();
        return entries.stream()
                .filter(entry -> userId == null || entry.getUserId().equals(userId))
                .filter(entry -> channel == null || entry.getChannel() == channel)
                .filter(entry -> status == null || entry.getStatus() == status)
                .sorted(Comparator.comparing(NotificationOutbox::getCreatedAt).reversed())
                .map(NotificationMapper::toOutboxResponse)
                .toList();
    }
}
