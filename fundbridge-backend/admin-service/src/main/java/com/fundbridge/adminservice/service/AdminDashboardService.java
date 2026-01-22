package com.fundbridge.adminservice.service;

import com.fundbridge.adminservice.dto.AdminDashboardSummaryResponse;
import com.fundbridge.adminservice.dto.AdminKpiSnapshotResponse;
import com.fundbridge.adminservice.entity.AdminAlertStatus;
import com.fundbridge.adminservice.repository.AdminActionRepository;
import com.fundbridge.adminservice.repository.AdminAlertRepository;
import com.fundbridge.adminservice.repository.AdminApprovalRepository;
import com.fundbridge.adminservice.repository.AdminAuditLogRepository;
import com.fundbridge.adminservice.repository.AdminRiskEventRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class AdminDashboardService {

    private final AdminKpiService kpiService;
    private final AdminAlertRepository alertRepository;
    private final AdminRiskEventRepository riskEventRepository;
    private final AdminApprovalRepository approvalRepository;
    private final AdminActionRepository actionRepository;
    private final AdminAuditLogRepository auditLogRepository;

    public AdminDashboardService(AdminKpiService kpiService,
                                 AdminAlertRepository alertRepository,
                                 AdminRiskEventRepository riskEventRepository,
                                 AdminApprovalRepository approvalRepository,
                                 AdminActionRepository actionRepository,
                                 AdminAuditLogRepository auditLogRepository) {
        this.kpiService = kpiService;
        this.alertRepository = alertRepository;
        this.riskEventRepository = riskEventRepository;
        this.approvalRepository = approvalRepository;
        this.actionRepository = actionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public AdminDashboardSummaryResponse getSummary() {
        AdminKpiSnapshotResponse kpis = null;
        try {
            kpis = kpiService.getLatestSnapshot();
        } catch (Exception ignored) {
        }

        long activeAlerts = alertRepository.countByStatus(AdminAlertStatus.OPEN);
        long riskEvents = riskEventRepository.count();
        long approvals = approvalRepository.count();
        long actions = actionRepository.count();
        long auditLogs = auditLogRepository.count();

        return new AdminDashboardSummaryResponse(
                kpis,
                activeAlerts,
                riskEvents,
                approvals,
                actions,
                auditLogs,
                Instant.now()
        );
    }
}
