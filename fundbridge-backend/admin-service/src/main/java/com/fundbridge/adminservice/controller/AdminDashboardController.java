package com.fundbridge.adminservice.controller;

import com.fundbridge.adminservice.dto.AdminDashboardOverviewResponse;
import com.fundbridge.adminservice.dto.AdminDashboardSummaryResponse;
import com.fundbridge.adminservice.service.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")
@Validated
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    public AdminDashboardController(AdminDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<AdminDashboardSummaryResponse> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    @GetMapping("/overview")
    public ResponseEntity<AdminDashboardOverviewResponse> getOverview(
            @RequestParam(value = "riskLimit", required = false) Integer riskLimit,
            @RequestParam(value = "approvalLimit", required = false) Integer approvalLimit,
            @RequestParam(value = "alertLimit", required = false) Integer alertLimit,
            @RequestParam(value = "actionLimit", required = false) Integer actionLimit,
            @RequestParam(value = "auditLimit", required = false) Integer auditLimit) {
        return ResponseEntity.ok(
                dashboardService.getOverview(riskLimit, approvalLimit, alertLimit, actionLimit, auditLimit)
        );
    }
}
