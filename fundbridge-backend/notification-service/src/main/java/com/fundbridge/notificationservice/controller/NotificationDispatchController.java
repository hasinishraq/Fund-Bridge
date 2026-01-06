package com.fundbridge.notificationservice.controller;

import com.fundbridge.notificationservice.dto.NotificationDispatchRequest;
import com.fundbridge.notificationservice.dto.NotificationDispatchResponse;
import com.fundbridge.notificationservice.service.NotificationDispatchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
@Validated
public class NotificationDispatchController {

    private final NotificationDispatchService dispatchService;

    public NotificationDispatchController(NotificationDispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    @PostMapping("/dispatch")
    public ResponseEntity<NotificationDispatchResponse> dispatch(@Valid @RequestBody NotificationDispatchRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(dispatchService.dispatch(request));
    }
}
