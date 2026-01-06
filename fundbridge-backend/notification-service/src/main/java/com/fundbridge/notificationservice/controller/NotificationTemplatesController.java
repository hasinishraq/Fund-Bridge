package com.fundbridge.notificationservice.controller;

import com.fundbridge.notificationservice.dto.CreateNotificationTemplateRequest;
import com.fundbridge.notificationservice.dto.NotificationTemplateResponse;
import com.fundbridge.notificationservice.dto.UpdateTemplateStatusRequest;
import com.fundbridge.notificationservice.entity.NotificationChannel;
import com.fundbridge.notificationservice.service.NotificationTemplateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/notifications/templates")
@Validated
public class NotificationTemplatesController {

    private final NotificationTemplateService templateService;

    public NotificationTemplatesController(NotificationTemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationTemplateResponse>> listTemplates(
            @RequestParam(value = "templateKey", required = false) String templateKey,
            @RequestParam(value = "channel", required = false) NotificationChannel channel,
            @RequestParam(value = "active", required = false) Boolean active) {
        return ResponseEntity.ok(templateService.listTemplates(templateKey, channel, active));
    }

    @PostMapping
    public ResponseEntity<NotificationTemplateResponse> createTemplate(
            @Valid @RequestBody CreateNotificationTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(templateService.createTemplate(request));
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<NotificationTemplateResponse> updateStatus(@PathVariable Long id,
                                                                      @Valid @RequestBody UpdateTemplateStatusRequest request) {
        return ResponseEntity.ok(templateService.updateTemplateStatus(id, request.active()));
    }
}
