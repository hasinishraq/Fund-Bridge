package com.fundbridge.adminservice.dto;

import java.util.List;

public record AdminSearchResponse(
        String query,
        List<AdminRiskEventResponse> riskEvents,
        List<AdminApprovalResponse> approvals,
        List<AdminActionResponse> actions,
        List<AdminAuditLogResponse> auditLogs
) {
}
