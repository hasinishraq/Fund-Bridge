package com.fundbridge.notificationservice.controller;

import com.fundbridge.notificationservice.dto.NotificationOutboxResponse;
import com.fundbridge.notificationservice.entity.NotificationChannel;
import com.fundbridge.notificationservice.entity.NotificationStatus;
import com.fundbridge.notificationservice.service.NotificationOutboxService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/notifications/outbox")
@Validated
public class NotificationOutboxController {

    private final NotificationOutboxService outboxService;

    public NotificationOutboxController(NotificationOutboxService outboxService) {
        this.outboxService = outboxService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationOutboxResponse>> listOutbox(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "channel", required = false) NotificationChannel channel,
            @RequestParam(value = "status", required = false) NotificationStatus status) {
        return ResponseEntity.ok(outboxService.listOutbox(userId, channel, status));
    }
}
