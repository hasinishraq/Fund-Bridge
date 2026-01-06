package com.fundbridge.notificationservice.service;

import com.fundbridge.notificationservice.dto.NotificationDispatchRequest;
import com.fundbridge.notificationservice.dto.NotificationDispatchResponse;
import com.fundbridge.notificationservice.entity.NotificationChannel;
import com.fundbridge.notificationservice.entity.NotificationOutbox;
import com.fundbridge.notificationservice.entity.NotificationPreference;
import com.fundbridge.notificationservice.entity.NotificationStatus;
import com.fundbridge.notificationservice.exception.BadRequestException;
import com.fundbridge.notificationservice.mapper.NotificationMapper;
import com.fundbridge.notificationservice.repository.NotificationOutboxRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class NotificationDispatchService {

    private final NotificationOutboxRepository outboxRepository;
    private final NotificationPreferenceService preferenceService;
    private final NotificationPayloadService payloadService;
    private final NotificationRecipientResolver recipientResolver;

    public NotificationDispatchService(NotificationOutboxRepository outboxRepository,
                                       NotificationPreferenceService preferenceService,
                                       NotificationPayloadService payloadService,
                                       NotificationRecipientResolver recipientResolver) {
        this.outboxRepository = outboxRepository;
        this.preferenceService = preferenceService;
        this.payloadService = payloadService;
        this.recipientResolver = recipientResolver;
    }

    @Transactional
    public NotificationDispatchResponse dispatch(NotificationDispatchRequest request) {
        NotificationPreference preference = preferenceService.resolvePreferences(request.userId());
        Set<NotificationChannel> targetChannels = resolveChannels(request.channels(), preference);
        List<NotificationChannel> skippedChannels = resolveSkippedChannels(request.channels(), preference);
        String payloadJson = payloadService.writePayload(request.payload());
        Instant scheduledAt = request.scheduledAt() != null ? request.scheduledAt() : Instant.now();

        boolean emailRemoved = false;
        if (targetChannels.contains(NotificationChannel.EMAIL)) {
            String recipientEmail = recipientResolver.resolveRecipientEmail(request.payload());
            if (recipientEmail == null) {
                targetChannels.remove(NotificationChannel.EMAIL);
                skippedChannels.add(NotificationChannel.EMAIL);
                emailRemoved = true;
            }
        }

        if (targetChannels.isEmpty()) {
            if (emailRemoved) {
                throw new BadRequestException("Recipient email not provided for EMAIL channel");
            }
            throw new BadRequestException("No enabled notification channels for user");
        }

        List<NotificationOutbox> outboxEntries = new ArrayList<>();
        int channelCount = targetChannels.size();
        for (NotificationChannel channel : targetChannels) {
            String idempotencyKey = resolveIdempotencyKey(request.idempotencyKey(), channel, channelCount);
            validateIdempotencyKey(idempotencyKey);
            NotificationOutbox existing = idempotencyKey == null
                    ? null
                    : outboxRepository.findByIdempotencyKey(idempotencyKey).orElse(null);
            if (existing != null) {
                outboxEntries.add(existing);
                continue;
            }

            NotificationOutbox outbox = new NotificationOutbox();
            outbox.setUserId(request.userId());
            outbox.setChannel(channel);
            outbox.setTemplateKey(request.templateKey().trim());
            outbox.setPayloadJson(payloadJson);
            outbox.setIdempotencyKey(idempotencyKey);
            outbox.setStatus(NotificationStatus.PENDING);
            outbox.setScheduledAt(scheduledAt);
            outboxEntries.add(outboxRepository.save(outbox));
        }

        return NotificationMapper.toDispatchResponse(outboxEntries, skippedChannels);
    }

    private Set<NotificationChannel> resolveChannels(List<NotificationChannel> requested,
                                                     NotificationPreference preference) {
        Set<NotificationChannel> channels = new LinkedHashSet<>();
        if (requested == null || requested.isEmpty()) {
            if (preference.isEmailEnabled()) {
                channels.add(NotificationChannel.EMAIL);
            }
            if (preference.isSmsEnabled()) {
                channels.add(NotificationChannel.SMS);
            }
            if (preference.isInappEnabled()) {
                channels.add(NotificationChannel.INAPP);
            }
            return channels;
        }

        for (NotificationChannel channel : requested) {
            if (isChannelEnabled(channel, preference)) {
                channels.add(channel);
            }
        }
        return channels;
    }

    private List<NotificationChannel> resolveSkippedChannels(List<NotificationChannel> requested,
                                                             NotificationPreference preference) {
        List<NotificationChannel> skipped = new ArrayList<>();
        if (requested == null || requested.isEmpty()) {
            return skipped;
        }
        for (NotificationChannel channel : requested) {
            if (!isChannelEnabled(channel, preference)) {
                skipped.add(channel);
            }
        }
        return skipped;
    }

    private boolean isChannelEnabled(NotificationChannel channel, NotificationPreference preference) {
        return switch (channel) {
            case EMAIL -> preference.isEmailEnabled();
            case SMS -> preference.isSmsEnabled();
            case INAPP -> preference.isInappEnabled();
        };
    }

    private String resolveIdempotencyKey(String baseKey, NotificationChannel channel, int channelCount) {
        if (baseKey == null || baseKey.isBlank()) {
            return null;
        }
        String trimmed = baseKey.trim();
        if (channelCount > 1) {
            return trimmed + ":" + channel.name();
        }
        return trimmed;
    }

    private void validateIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey != null && idempotencyKey.length() > 80) {
            throw new BadRequestException("Idempotency key exceeds 80 characters");
        }
    }
}
