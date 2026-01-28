package com.fundbridge.adminservice.controller;

import com.fundbridge.adminservice.dto.SystemHealthResponse;
import com.fundbridge.adminservice.service.AdminSystemHealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/system")
public class AdminSystemHealthController {

    private final AdminSystemHealthService systemHealthService;

    public AdminSystemHealthController(AdminSystemHealthService systemHealthService) {
        this.systemHealthService = systemHealthService;
    }

    @GetMapping("/health")
    public ResponseEntity<SystemHealthResponse> getSystemHealth() {
        return ResponseEntity.ok(systemHealthService.getSystemHealth());
    }
}
