package com.fundbridge.adminservice.controller;

import com.fundbridge.adminservice.dto.AdminAlertResponse;
import com.fundbridge.adminservice.dto.CreateAdminAlertRequest;
import com.fundbridge.adminservice.entity.AdminAlertSeverity;
import com.fundbridge.adminservice.entity.AdminAlertStatus;
import com.fundbridge.adminservice.service.AdminAlertService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/alerts")
@Validated
public class AdminAlertController {

    private final AdminAlertService alertService;

    public AdminAlertController(AdminAlertService alertService) {
        this.alertService = alertService;
    }

    @PostMapping
    public ResponseEntity<AdminAlertResponse> createAlert(@Valid @RequestBody CreateAdminAlertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(alertService.createAlert(request));
    }

    @GetMapping
    public ResponseEntity<List<AdminAlertResponse>> listAlerts(
            @RequestParam(value = "severity", required = false) AdminAlertSeverity severity,
            @RequestParam(value = "status", required = false) AdminAlertStatus status) {
        return ResponseEntity.ok(alertService.listAlerts(severity, status));
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<AdminAlertResponse> resolveAlert(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.resolveAlert(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminAlertResponse> getAlert(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.getAlert(id));
    }
}
