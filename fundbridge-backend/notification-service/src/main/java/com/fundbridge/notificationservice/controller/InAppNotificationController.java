package com.fundbridge.notificationservice.controller;

import com.fundbridge.notificationservice.dto.InAppNotificationResponse;
import com.fundbridge.notificationservice.service.InAppNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/notifications/inapp")
@Validated
public class InAppNotificationController {

    private final InAppNotificationService inAppNotificationService;

    public InAppNotificationController(InAppNotificationService inAppNotificationService) {
        this.inAppNotificationService = inAppNotificationService;
    }

    @GetMapping
    public ResponseEntity<List<InAppNotificationResponse>> listNotifications(
            @RequestParam("userId") Long userId,
            @RequestParam(value = "unreadOnly", defaultValue = "false") boolean unreadOnly) {
        return ResponseEntity.ok(inAppNotificationService.listNotifications(userId, unreadOnly));
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<InAppNotificationResponse> markRead(@PathVariable Long notificationId,
                                                               @RequestParam("userId") Long userId) {
        return ResponseEntity.ok(inAppNotificationService.markRead(userId, notificationId));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long notificationId,
                                                    @RequestParam("userId") Long userId) {
        inAppNotificationService.deleteNotification(userId, notificationId);
        return ResponseEntity.noContent().build();
    }
}
