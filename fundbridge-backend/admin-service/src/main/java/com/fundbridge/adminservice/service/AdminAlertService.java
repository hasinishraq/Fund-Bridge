package com.fundbridge.adminservice.service;

import com.fundbridge.adminservice.dto.AdminAlertResponse;
import com.fundbridge.adminservice.dto.CreateAdminAlertRequest;
import com.fundbridge.adminservice.entity.AdminAlert;
import com.fundbridge.adminservice.entity.AdminAlertSeverity;
import com.fundbridge.adminservice.entity.AdminAlertStatus;
import com.fundbridge.adminservice.exception.ResourceNotFoundException;
import com.fundbridge.adminservice.repository.AdminAlertRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdminAlertService {

    private final AdminAlertRepository alertRepository;

    public AdminAlertService(AdminAlertRepository alertRepository) {
        this.alertRepository = alertRepository;
    }

    @Transactional
    public AdminAlertResponse createAlert(CreateAdminAlertRequest request) {
        AdminAlert alert = new AdminAlert();
        alert.setTitle(request.title().trim());
        alert.setDetail(normalizeOptional(request.detail()));
        alert.setSeverity(request.severity());
        alert.setActionLabel(normalizeOptional(request.actionLabel()));
        if (request.occurredAt() != null) {
            alert.setCreatedAt(request.occurredAt());
        }
        AdminAlert saved = alertRepository.save(alert);
        return toResponse(saved);
    }

    public List<AdminAlertResponse> listAlerts(AdminAlertSeverity severity, AdminAlertStatus status) {
        return alertRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(alert -> severity == null || severity == alert.getSeverity())
                .filter(alert -> status == null || status == alert.getStatus())
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminAlertResponse resolveAlert(Long id) {
        AdminAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found"));
        alert.setStatus(AdminAlertStatus.RESOLVED);
        alert.setResolvedAt(Instant.now());
        return toResponse(alertRepository.save(alert));
    }

    public AdminAlertResponse getAlert(Long id) {
        AdminAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found"));
        return toResponse(alert);
    }

    private AdminAlertResponse toResponse(AdminAlert alert) {
        return new AdminAlertResponse(
                alert.getId(),
                alert.getTitle(),
                alert.getDetail(),
                alert.getSeverity(),
                alert.getStatus(),
                alert.getActionLabel(),
                alert.getCreatedAt(),
                alert.getResolvedAt()
        );
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
