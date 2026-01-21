package com.fundbridge.adminservice.controller;

import com.fundbridge.adminservice.dto.AdminAuditLogResponse;
import com.fundbridge.adminservice.dto.CreateAdminAuditLogRequest;
import com.fundbridge.adminservice.service.AdminAuditLogService;
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
@RequestMapping("/admin/audit-logs")
@Validated
public class AdminAuditLogController {

    private final AdminAuditLogService auditLogService;

    public AdminAuditLogController(AdminAuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @PostMapping
    public ResponseEntity<AdminAuditLogResponse> recordLog(@Valid @RequestBody CreateAdminAuditLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auditLogService.recordLog(request));
    }

    @GetMapping
    public ResponseEntity<List<AdminAuditLogResponse>> listLogs(
            @RequestParam(value = "actorUserId", required = false) Long actorUserId,
            @RequestParam(value = "serviceName", required = false) String serviceName,
            @RequestParam(value = "eventType", required = false) String eventType,
            @RequestParam(value = "eventRef", required = false) String eventRef) {
        return ResponseEntity.ok(auditLogService.listLogs(actorUserId, serviceName, eventType, eventRef));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminAuditLogResponse> getLog(@PathVariable Long id) {
        return ResponseEntity.ok(auditLogService.getLog(id));
    }
}
