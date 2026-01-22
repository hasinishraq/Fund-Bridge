package com.fundbridge.adminservice.service;

import com.fundbridge.adminservice.dto.AdminRiskEventResponse;
import com.fundbridge.adminservice.dto.CreateAdminRiskEventRequest;
import com.fundbridge.adminservice.entity.AdminRiskEvent;
import com.fundbridge.adminservice.exception.ResourceNotFoundException;
import com.fundbridge.adminservice.repository.AdminRiskEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdminRiskEventService {

    private final AdminRiskEventRepository riskEventRepository;

    public AdminRiskEventService(AdminRiskEventRepository riskEventRepository) {
        this.riskEventRepository = riskEventRepository;
    }

    @Transactional
    public AdminRiskEventResponse createEvent(CreateAdminRiskEventRequest request) {
        AdminRiskEvent event = new AdminRiskEvent();
        event.setEventType(request.type().trim());
        event.setStatus(request.status().trim());
        event.setUserId(normalizeOptional(request.userId()));
        event.setUserName(normalizeOptional(request.userName()));
        event.setLoanId(normalizeOptional(request.loanId()));
        event.setWalletId(normalizeOptional(request.walletId()));
        event.setGateway(normalizeOptional(request.gateway()));
        event.setReferenceId(normalizeOptional(request.referenceId()));
        event.setAmount(request.amount());
        event.setRiskScore(request.riskScore());
        event.setChannel(normalizeOptional(request.channel()));
        if (request.occurredAt() != null) {
            event.setCreatedAt(request.occurredAt());
            event.setUpdatedAt(request.occurredAt());
        }
        AdminRiskEvent saved = riskEventRepository.save(event);
        return toResponse(saved);
    }

    public List<AdminRiskEventResponse> listEvents(String status,
                                                   String gateway,
                                                   Integer minRiskScore,
                                                   LocalDate dateFrom,
                                                   LocalDate dateTo,
                                                   String query) {
        String normalizedStatus = normalizeOptional(status);
        String normalizedGateway = normalizeOptional(gateway);
        String normalizedQuery = normalizeOptional(query);
        Instant fromInstant = dateFrom != null ? dateFrom.atStartOfDay(ZoneOffset.UTC).toInstant() : null;
        Instant toInstant = dateTo != null
                ? dateTo.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant()
                : null;

        return riskEventRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(event -> normalizedStatus == null
                        || normalizedStatus.equalsIgnoreCase(event.getStatus()))
                .filter(event -> normalizedGateway == null
                        || normalizedGateway.equalsIgnoreCase(event.getGateway()))
                .filter(event -> minRiskScore == null
                        || (event.getRiskScore() != null && event.getRiskScore() >= minRiskScore))
                .filter(event -> fromInstant == null
                        || (event.getCreatedAt() != null && !event.getCreatedAt().isBefore(fromInstant)))
                .filter(event -> toInstant == null
                        || (event.getCreatedAt() != null && event.getCreatedAt().isBefore(toInstant)))
                .filter(event -> matchesQuery(event, normalizedQuery))
                .map(this::toResponse)
                .toList();
    }

    public AdminRiskEventResponse getEvent(Long id) {
        AdminRiskEvent event = riskEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Risk event not found"));
        return toResponse(event);
    }

    private boolean matchesQuery(AdminRiskEvent event, String query) {
        if (query == null) {
            return true;
        }
        String needle = query.toLowerCase();
        return contains(event.getEventType(), needle)
                || contains(event.getStatus(), needle)
                || contains(event.getUserId(), needle)
                || contains(event.getUserName(), needle)
                || contains(event.getLoanId(), needle)
                || contains(event.getWalletId(), needle)
                || contains(event.getGateway(), needle)
                || contains(event.getReferenceId(), needle)
                || contains(event.getChannel(), needle);
    }

    private boolean contains(String value, String query) {
        return value != null && value.toLowerCase().contains(query);
    }

    private AdminRiskEventResponse toResponse(AdminRiskEvent event) {
        return new AdminRiskEventResponse(
            event.getId(),
            event.getEventType(),
            event.getStatus(),
            event.getUserId(),
                event.getUserName(),
                event.getLoanId(),
                event.getWalletId(),
                event.getGateway(),
                event.getReferenceId(),
                event.getAmount(),
                event.getRiskScore(),
                event.getChannel(),
                event.getCreatedAt(),
            event.getUpdatedAt()
        );
    }

    AdminRiskEventResponse toResponseForSearch(AdminRiskEvent event) {
        return toResponse(event);
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
