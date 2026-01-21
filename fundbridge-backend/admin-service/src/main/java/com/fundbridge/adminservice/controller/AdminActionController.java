package com.fundbridge.adminservice.controller;

import com.fundbridge.adminservice.dto.AdminActionResponse;
import com.fundbridge.adminservice.dto.CreateAdminActionRequest;
import com.fundbridge.adminservice.entity.AdminActionType;
import com.fundbridge.adminservice.entity.AdminTargetType;
import com.fundbridge.adminservice.service.AdminActionService;
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
@RequestMapping("/admin/actions")
@Validated
public class AdminActionController {

    private final AdminActionService actionService;

    public AdminActionController(AdminActionService actionService) {
        this.actionService = actionService;
    }

    @PostMapping
    public ResponseEntity<AdminActionResponse> createAction(@Valid @RequestBody CreateAdminActionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(actionService.createAction(request));
    }

    @GetMapping
    public ResponseEntity<List<AdminActionResponse>> listActions(
            @RequestParam(value = "adminUserId", required = false) Long adminUserId,
            @RequestParam(value = "actionType", required = false) AdminActionType actionType,
            @RequestParam(value = "targetType", required = false) AdminTargetType targetType,
            @RequestParam(value = "targetRef", required = false) String targetRef) {
        return ResponseEntity.ok(actionService.listActions(adminUserId, actionType, targetType, targetRef));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminActionResponse> getAction(@PathVariable Long id) {
        return ResponseEntity.ok(actionService.getAction(id));
    }
}
