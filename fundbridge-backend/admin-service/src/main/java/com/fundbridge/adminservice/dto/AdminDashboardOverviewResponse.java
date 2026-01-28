package com.fundbridge.adminservice.dto;

import java.time.Instant;
import java.util.List;

public record AdminDashboardOverviewResponse(
        AdminKpiSnapshotResponse kpis,
        SystemHealthResponse systemHealth,
        List<AdminRiskEventResponse> riskEvents,
        List<AdminApprovalResponse> approvals,
        List<AdminAlertResponse> alerts,
        List<AdminActionResponse> actions,
        List<AdminAuditLogResponse> auditLogs,
        long activeAlerts,
        long riskEventCount,
        long approvalCount,
        long actionCount,
        long auditLogCount,
        long uniqueAdminCount,
        Instant generatedAt
) {
}
