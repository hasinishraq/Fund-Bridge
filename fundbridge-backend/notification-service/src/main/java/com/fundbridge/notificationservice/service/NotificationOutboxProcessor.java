package com.fundbridge.notificationservice.service;

import com.fundbridge.notificationservice.config.NotificationOutboxProperties;
import com.fundbridge.notificationservice.entity.NotificationOutbox;
import com.fundbridge.notificationservice.entity.NotificationStatus;
import com.fundbridge.notificationservice.entity.NotificationTemplate;
import com.fundbridge.notificationservice.exception.MissingRecipientException;
import com.fundbridge.notificationservice.repository.NotificationOutboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class NotificationOutboxProcessor {

    private static final Logger log = LoggerFactory.getLogger(NotificationOutboxProcessor.class);

    private final NotificationOutboxRepository outboxRepository;
    private final NotificationTemplateService templateService;
    private final NotificationTemplateRenderer templateRenderer;
    private final NotificationPayloadService payloadService;
    private final NotificationRecipientResolver recipientResolver;
    private final InAppNotificationService inAppNotificationService;
    private final BrevoEmailService brevoEmailService;
    private final NotificationOutboxProperties properties;

    public NotificationOutboxProcessor(NotificationOutboxRepository outboxRepository,
                                       NotificationTemplateService templateService,
                                       NotificationTemplateRenderer templateRenderer,
                                       NotificationPayloadService payloadService,
                                       NotificationRecipientResolver recipientResolver,
                                       InAppNotificationService inAppNotificationService,
                                       BrevoEmailService brevoEmailService,
                                       NotificationOutboxProperties properties) {
        this.outboxRepository = outboxRepository;
        this.templateService = templateService;
        this.templateRenderer = templateRenderer;
        this.payloadService = payloadService;
        this.recipientResolver = recipientResolver;
        this.inAppNotificationService = inAppNotificationService;
        this.brevoEmailService = brevoEmailService;
        this.properties = properties;
    }

    @Scheduled(fixedDelayString = "${notification.outbox.poll-interval-ms:5000}")
    @Transactional
    public void processOutbox() {
        List<NotificationOutbox> batch = claimBatch();
        if (batch.isEmpty()) {
            return;
        }
        for (NotificationOutbox entry : batch) {
            processEntry(entry.getId());
        }
    }

    protected List<NotificationOutbox> claimBatch() {
        Instant now = Instant.now();
        Pageable pageable = PageRequest.of(0, properties.getBatchSize());
        List<NotificationOutbox> entries = outboxRepository.findReadyForProcessing(NotificationStatus.PENDING, now, pageable);
        if (entries.isEmpty()) {
            return entries;
        }
        for (NotificationOutbox entry : entries) {
            entry.setStatus(NotificationStatus.SENDING);
            entry.setLockedAt(now);
        }
        return entries;
    }

    protected void processEntry(Long entryId) {
        NotificationOutbox entry = outboxRepository.findById(entryId).orElse(null);
        if (entry == null || entry.getStatus() != NotificationStatus.SENDING) {
            return;
        }

        try {
            Map<String, Object> payload = payloadService.readPayload(entry.getPayloadJson());
            NotificationTemplate template = templateService.getActiveTemplate(entry.getTemplateKey(), entry.getChannel());
            String subject = templateRenderer.render(template.getSubject(), payload);
            String body = templateRenderer.render(template.getBody(), payload);

            switch (entry.getChannel()) {
                case INAPP -> {
                    String title = subject != null && !subject.isBlank() ? subject : template.getTemplateKey();
                    inAppNotificationService.createNotification(
                            entry.getUserId(),
                            entry.getTemplateKey(),
                            title,
                            body,
                            entry.getPayloadJson()
                    );
                }
                case EMAIL -> {
                    String recipientEmail = recipientResolver.resolveRecipientEmail(payload);
                    if (recipientEmail == null) {
                        throw new MissingRecipientException("Recipient email not provided in payload");
                    }
                    String emailSubject = subject != null && !subject.isBlank()
                            ? subject
                            : template.getTemplateKey();
                    brevoEmailService.sendEmail(recipientEmail, emailSubject, body);
                }
                case SMS -> log.info("Dispatching notification id={} channel={} userId={} templateKey={}",
                        entry.getId(), entry.getChannel(), entry.getUserId(), entry.getTemplateKey());
            }

            entry.setStatus(NotificationStatus.SENT);
            entry.setSentAt(Instant.now());
            entry.setLockedAt(null);
            entry.setLastError(null);
        } catch (Exception ex) {
            log.warn("Failed to dispatch notification id={} channel={} userId={} templateKey={}",
                    entry.getId(), entry.getChannel(), entry.getUserId(), entry.getTemplateKey(), ex);
            handleFailure(entry, ex);
        }
    }

    private void handleFailure(NotificationOutbox entry, Exception ex) {
        if (ex instanceof MissingRecipientException) {
            entry.setAttempts(entry.getAttempts() + 1);
            entry.setLockedAt(null);
            entry.setLastError(truncateError(ex));
            entry.setStatus(NotificationStatus.FAILED);
            return;
        }
        int attempts = entry.getAttempts() + 1;
        entry.setAttempts(attempts);
        entry.setLockedAt(null);
        entry.setLastError(truncateError(ex));
        if (attempts >= properties.getMaxAttempts()) {
            entry.setStatus(NotificationStatus.FAILED);
            return;
        }
        entry.setStatus(NotificationStatus.PENDING);
        entry.setScheduledAt(Instant.now().plusMillis(properties.getRetryDelayMs()));
    }

    private String truncateError(Exception ex) {
        String message = ex.getMessage();
        if (message == null || message.isBlank()) {
            message = "Unknown error";
        }
        message = message.trim();
        return message.length() <= 255 ? message : message.substring(0, 255);
    }
}
