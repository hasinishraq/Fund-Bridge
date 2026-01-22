package com.fundbridge.adminservice.dto;

import java.time.Instant;

public record AdminDashboardSummaryResponse(
        AdminKpiSnapshotResponse kpis,
        long activeAlerts,
        long riskEvents,
        long approvals,
        long actions,
        long auditLogs,
        Instant generatedAt
) {
}
