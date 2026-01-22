package com.fundbridge.adminservice.controller;

import com.fundbridge.adminservice.dto.AdminApprovalResponse;
import com.fundbridge.adminservice.dto.CreateAdminApprovalRequest;
import com.fundbridge.adminservice.service.AdminApprovalService;
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
@RequestMapping("/admin/approvals")
@Validated
public class AdminApprovalController {

    private final AdminApprovalService approvalService;

    public AdminApprovalController(AdminApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @PostMapping
    public ResponseEntity<AdminApprovalResponse> createApproval(@Valid @RequestBody CreateAdminApprovalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(approvalService.createApproval(request));
    }

    @GetMapping
    public ResponseEntity<List<AdminApprovalResponse>> listApprovals(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "minRiskScore", required = false) Integer minRiskScore,
            @RequestParam(value = "query", required = false) String query) {
        return ResponseEntity.ok(approvalService.listApprovals(type, status, minRiskScore, query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminApprovalResponse> getApproval(@PathVariable Long id) {
        return ResponseEntity.ok(approvalService.getApproval(id));
    }
}
