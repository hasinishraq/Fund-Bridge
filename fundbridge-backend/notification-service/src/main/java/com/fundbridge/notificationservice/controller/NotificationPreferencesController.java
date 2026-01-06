package com.fundbridge.notificationservice.controller;

import com.fundbridge.notificationservice.dto.NotificationPreferenceResponse;
import com.fundbridge.notificationservice.dto.UpdateNotificationPreferenceRequest;
import com.fundbridge.notificationservice.service.NotificationPreferenceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications/preferences")
@Validated
public class NotificationPreferencesController {

    private final NotificationPreferenceService preferenceService;

    public NotificationPreferencesController(NotificationPreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<NotificationPreferenceResponse> getPreferences(@PathVariable Long userId) {
        return ResponseEntity.ok(preferenceService.getPreferences(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<NotificationPreferenceResponse> updatePreferences(@PathVariable Long userId,
                                                                             @Valid @RequestBody UpdateNotificationPreferenceRequest request) {
        return ResponseEntity.ok(preferenceService.updatePreferences(userId, request));
    }
}
