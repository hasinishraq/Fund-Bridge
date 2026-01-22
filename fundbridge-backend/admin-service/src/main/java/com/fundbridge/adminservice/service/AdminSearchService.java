package com.fundbridge.adminservice.service;

import com.fundbridge.adminservice.dto.AdminActionResponse;
import com.fundbridge.adminservice.dto.AdminApprovalResponse;
import com.fundbridge.adminservice.dto.AdminAuditLogResponse;
import com.fundbridge.adminservice.dto.AdminRiskEventResponse;
import com.fundbridge.adminservice.dto.AdminSearchResponse;
import com.fundbridge.adminservice.entity.AdminAction;
import com.fundbridge.adminservice.entity.AdminAuditLog;
import com.fundbridge.adminservice.entity.AdminRiskEvent;
import com.fundbridge.adminservice.repository.AdminActionRepository;
import com.fundbridge.adminservice.repository.AdminApprovalRepository;
import com.fundbridge.adminservice.repository.AdminAuditLogRepository;
import com.fundbridge.adminservice.repository.AdminRiskEventRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminSearchService {

    private static final int RESULT_LIMIT = 25;

    private final AdminRiskEventRepository riskEventRepository;
    private final AdminApprovalRepository approvalRepository;
    private final AdminActionRepository actionRepository;
    private final AdminAuditLogRepository auditLogRepository;
    private final AdminRiskEventService riskEventService;
    private final AdminApprovalService approvalService;
    private final AdminActionService actionService;
    private final AdminAuditLogService auditLogService;

    public AdminSearchService(AdminRiskEventRepository riskEventRepository,
                              AdminApprovalRepository approvalRepository,
                              AdminActionRepository actionRepository,
                              AdminAuditLogRepository auditLogRepository,
                              AdminRiskEventService riskEventService,
                              AdminApprovalService approvalService,
                              AdminActionService actionService,
                              AdminAuditLogService auditLogService) {
        this.riskEventRepository = riskEventRepository;
        this.approvalRepository = approvalRepository;
        this.actionRepository = actionRepository;
        this.auditLogRepository = auditLogRepository;
        this.riskEventService = riskEventService;
        this.approvalService = approvalService;
        this.actionService = actionService;
        this.auditLogService = auditLogService;
    }

    public AdminSearchResponse search(String query) {
        String normalized = normalizeOptional(query);
        if (normalized == null) {
            return new AdminSearchResponse("", List.of(), List.of(), List.of(), List.of());
        }
        List<AdminRiskEventResponse> riskEvents = riskEventRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(event -> matches(event, normalized))
                .limit(RESULT_LIMIT)
                .map(riskEventService::toResponseForSearch)
                .toList();
        List<AdminApprovalResponse> approvals = approvalRepository.findAllByOrderByRequestedAtDesc()
                .stream()
                .filter(approval -> matches(approval, normalized))
                .limit(RESULT_LIMIT)
                .map(approvalService::toResponseForSearch)
                .toList();
        List<AdminActionResponse> actions = actionRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(action -> matches(action, normalized))
                .limit(RESULT_LIMIT)
                .map(actionService::toResponseForSearch)
                .toList();
        List<AdminAuditLogResponse> auditLogs = auditLogRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(log -> matches(log, normalized))
                .limit(RESULT_LIMIT)
                .map(auditLogService::toResponseForSearch)
                .toList();

        return new AdminSearchResponse(normalized, riskEvents, approvals, actions, auditLogs);
    }

    private boolean matches(AdminRiskEvent event, String query) {
        return contains(event.getEventType(), query)
                || contains(event.getStatus(), query)
                || contains(event.getUserId(), query)
                || contains(event.getUserName(), query)
                || contains(event.getLoanId(), query)
                || contains(event.getWalletId(), query)
                || contains(event.getGateway(), query)
                || contains(event.getReferenceId(), query);
    }

    private boolean matches(com.fundbridge.adminservice.entity.AdminApproval approval, String query) {
        return contains(approval.getApprovalType(), query)
                || contains(approval.getStatus(), query)
                || contains(approval.getUserId(), query)
                || contains(approval.getUserName(), query)
                || contains(approval.getLoanId(), query)
                || contains(approval.getQueue(), query);
    }

    private boolean matches(AdminAction action, String query) {
        return contains(action.getActionType() != null ? action.getActionType().name() : null, query)
                || contains(action.getTargetType() != null ? action.getTargetType().name() : null, query)
                || contains(action.getTargetRef(), query)
                || contains(action.getReason(), query)
                || contains(action.getAdminUserId() != null ? action.getAdminUserId().toString() : null, query);
    }

    private boolean matches(AdminAuditLog log, String query) {
        return contains(log.getServiceName(), query)
                || contains(log.getEventType(), query)
                || contains(log.getEventRef(), query)
                || contains(log.getDetails(), query)
                || contains(log.getActorUserId() != null ? log.getActorUserId().toString() : null, query);
    }

    private boolean contains(String value, String query) {
        return value != null && value.toLowerCase().contains(query);
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim().toLowerCase();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
