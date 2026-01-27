package com.fundbridge.adminservice.service;

import com.fundbridge.adminservice.dto.AdminActionResponse;
import com.fundbridge.adminservice.dto.AdminAlertResponse;
import com.fundbridge.adminservice.dto.AdminApprovalResponse;
import com.fundbridge.adminservice.dto.AdminAuditLogResponse;
import com.fundbridge.adminservice.dto.AdminDashboardOverviewResponse;
import com.fundbridge.adminservice.dto.AdminDashboardSummaryResponse;
import com.fundbridge.adminservice.dto.AdminKpiSnapshotResponse;
import com.fundbridge.adminservice.dto.AdminRiskEventResponse;
import com.fundbridge.adminservice.entity.AdminAlertStatus;
import com.fundbridge.adminservice.repository.AdminActionRepository;
import com.fundbridge.adminservice.repository.AdminAlertRepository;
import com.fundbridge.adminservice.repository.AdminApprovalRepository;
import com.fundbridge.adminservice.repository.AdminAuditLogRepository;
import com.fundbridge.adminservice.repository.AdminRiskEventRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class AdminDashboardService {

    private final AdminKpiService kpiService;
    private final AdminMetricsService metricsService;
    private final AdminAlertService alertService;
    private final AdminRiskEventService riskEventService;
    private final AdminApprovalService approvalService;
    private final AdminActionService actionService;
    private final AdminAuditLogService auditLogService;
    private final AdminAlertRepository alertRepository;
    private final AdminRiskEventRepository riskEventRepository;
    private final AdminApprovalRepository approvalRepository;
    private final AdminActionRepository actionRepository;
    private final AdminAuditLogRepository auditLogRepository;

    public AdminDashboardService(AdminKpiService kpiService,
                                 AdminMetricsService metricsService,
                                 AdminAlertService alertService,
                                 AdminRiskEventService riskEventService,
                                 AdminApprovalService approvalService,
                                 AdminActionService actionService,
                                 AdminAuditLogService auditLogService,
                                 AdminAlertRepository alertRepository,
                                 AdminRiskEventRepository riskEventRepository,
                                 AdminApprovalRepository approvalRepository,
                                 AdminActionRepository actionRepository,
                                 AdminAuditLogRepository auditLogRepository) {
        this.kpiService = kpiService;
        this.metricsService = metricsService;
        this.alertService = alertService;
        this.riskEventService = riskEventService;
        this.approvalService = approvalService;
        this.actionService = actionService;
        this.auditLogService = auditLogService;
        this.alertRepository = alertRepository;
        this.riskEventRepository = riskEventRepository;
        this.approvalRepository = approvalRepository;
        this.actionRepository = actionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public AdminDashboardSummaryResponse getSummary() {
        AdminKpiSnapshotResponse kpis = metricsService.buildLiveSnapshot();
        if (kpis == null) {
            try {
                kpis = kpiService.getLatestSnapshot();
            } catch (Exception ignored) {
            }
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

    public AdminDashboardOverviewResponse getOverview(Integer riskLimit,
                                                      Integer approvalLimit,
                                                      Integer alertLimit,
                                                      Integer actionLimit,
                                                      Integer auditLimit) {
        AdminKpiSnapshotResponse kpis = metricsService.buildLiveSnapshot();
        if (kpis == null) {
            try {
                kpis = kpiService.getLatestSnapshot();
            } catch (Exception ignored) {
            }
        }

        int safeRiskLimit = clampLimit(riskLimit, 20);
        int safeApprovalLimit = clampLimit(approvalLimit, 10);
        int safeAlertLimit = clampLimit(alertLimit, 6);
        int safeActionLimit = clampLimit(actionLimit, 12);
        int safeAuditLimit = clampLimit(auditLimit, 12);

        List<AdminRiskEventResponse> riskEvents = riskEventService
                .listEvents(null, null, null, null, null, null)
                .stream()
                .limit(safeRiskLimit)
                .toList();
        List<AdminApprovalResponse> approvals = approvalService
                .listApprovals(null, null, null, null)
                .stream()
                .limit(safeApprovalLimit)
                .toList();
        List<AdminAlertResponse> alerts = alertService
                .listAlerts(null, AdminAlertStatus.OPEN)
                .stream()
                .limit(safeAlertLimit)
                .toList();
        List<AdminActionResponse> actions = actionService
                .listActions(null, null, null, null)
                .stream()
                .limit(safeActionLimit)
                .toList();
        List<AdminAuditLogResponse> auditLogs = auditLogService
                .listLogs(null, null, null, null)
                .stream()
                .limit(safeAuditLimit)
                .toList();

        long activeAlerts = alertRepository.countByStatus(AdminAlertStatus.OPEN);
        long riskEventCount = riskEventRepository.count();
        long approvalCount = approvalRepository.count();
        long actionCount = actionRepository.count();
        long auditLogCount = auditLogRepository.count();
        long uniqueAdminCount = actionRepository.countDistinctAdminUserId();

        return new AdminDashboardOverviewResponse(
                kpis,
                riskEvents,
                approvals,
                alerts,
                actions,
                auditLogs,
                activeAlerts,
                riskEventCount,
                approvalCount,
                actionCount,
                auditLogCount,
                uniqueAdminCount,
                Instant.now()
        );
    }

    private int clampLimit(Integer value, int fallback) {
        if (value == null) {
            return fallback;
        }
        int normalized = Math.max(1, value);
        return Math.min(normalized, 200);
    }
}
