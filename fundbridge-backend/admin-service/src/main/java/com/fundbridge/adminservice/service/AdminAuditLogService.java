package com.fundbridge.adminservice.service;

import com.fundbridge.adminservice.dto.AdminAuditLogResponse;
import com.fundbridge.adminservice.dto.CreateAdminAuditLogRequest;
import com.fundbridge.adminservice.entity.AdminAuditLog;
import com.fundbridge.adminservice.exception.ResourceNotFoundException;
import com.fundbridge.adminservice.repository.AdminAuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdminAuditLogService {

    private final AdminAuditLogRepository auditLogRepository;

    public AdminAuditLogService(AdminAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public AdminAuditLogResponse recordLog(CreateAdminAuditLogRequest request) {
        AdminAuditLog entry = new AdminAuditLog();
        entry.setActorUserId(request.actorUserId());
        entry.setServiceName(request.serviceName().trim());
        entry.setEventType(request.eventType().trim());
        entry.setEventRef(normalizeOptional(request.eventRef()));
        entry.setDetails(normalizeOptional(request.details()));
        AdminAuditLog saved = auditLogRepository.save(entry);
        return toResponse(saved);
    }

    public List<AdminAuditLogResponse> listLogs(Long actorUserId,
                                                String serviceName,
                                                String eventType,
                                                String eventRef) {
        String normalizedServiceName = normalizeOptional(serviceName);
        String normalizedEventType = normalizeOptional(eventType);
        String normalizedEventRef = normalizeOptional(eventRef);
        return auditLogRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(entry -> actorUserId == null || actorUserId.equals(entry.getActorUserId()))
                .filter(entry -> normalizedServiceName == null
                        || normalizedServiceName.equals(entry.getServiceName()))
                .filter(entry -> normalizedEventType == null
                        || normalizedEventType.equals(entry.getEventType()))
                .filter(entry -> normalizedEventRef == null
                        || normalizedEventRef.equals(entry.getEventRef()))
                .map(this::toResponse)
                .toList();
    }

    public AdminAuditLogResponse getLog(Long id) {
        AdminAuditLog entry = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audit log entry not found"));
        return toResponse(entry);
    }

    private AdminAuditLogResponse toResponse(AdminAuditLog entry) {
        return new AdminAuditLogResponse(
                entry.getId(),
                entry.getActorUserId(),
                entry.getServiceName(),
                entry.getEventType(),
                entry.getEventRef(),
                entry.getDetails(),
                entry.getCreatedAt()
        );
    }

    AdminAuditLogResponse toResponseForSearch(AdminAuditLog entry) {
        return toResponse(entry);
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
