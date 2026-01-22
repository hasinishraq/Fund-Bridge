package com.fundbridge.adminservice.controller;

import com.fundbridge.adminservice.dto.AdminKpiSnapshotResponse;
import com.fundbridge.adminservice.dto.CreateAdminKpiSnapshotRequest;
import com.fundbridge.adminservice.service.AdminKpiService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/kpis")
@Validated
public class AdminKpiController {

    private final AdminKpiService kpiService;

    public AdminKpiController(AdminKpiService kpiService) {
        this.kpiService = kpiService;
    }

    @PostMapping
    public ResponseEntity<AdminKpiSnapshotResponse> createSnapshot(
            @Valid @RequestBody CreateAdminKpiSnapshotRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(kpiService.createSnapshot(request));
    }

    @GetMapping
    public ResponseEntity<List<AdminKpiSnapshotResponse>> listSnapshots() {
        return ResponseEntity.ok(kpiService.listSnapshots());
    }

    @GetMapping("/latest")
    public ResponseEntity<AdminKpiSnapshotResponse> getLatestSnapshot() {
        return ResponseEntity.ok(kpiService.getLatestSnapshot());
    }
}
