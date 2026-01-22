package com.fundbridge.adminservice.service;

import com.fundbridge.adminservice.dto.AdminApprovalResponse;
import com.fundbridge.adminservice.dto.CreateAdminApprovalRequest;
import com.fundbridge.adminservice.entity.AdminApproval;
import com.fundbridge.adminservice.exception.ResourceNotFoundException;
import com.fundbridge.adminservice.repository.AdminApprovalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdminApprovalService {

    private final AdminApprovalRepository approvalRepository;

    public AdminApprovalService(AdminApprovalRepository approvalRepository) {
        this.approvalRepository = approvalRepository;
    }

    @Transactional
    public AdminApprovalResponse createApproval(CreateAdminApprovalRequest request) {
        AdminApproval approval = new AdminApproval();
        approval.setApprovalType(request.type().trim());
        approval.setStatus(request.status().trim());
        approval.setUserId(request.userId().trim());
        approval.setUserName(request.userName().trim());
        approval.setRiskScore(request.riskScore());
        approval.setAmount(request.amount());
        approval.setLoanId(normalizeOptional(request.loanId()));
        approval.setQueue(normalizeOptional(request.queue()));
        approval.setRequestedAt(request.requestedAt());
        AdminApproval saved = approvalRepository.save(approval);
        return toResponse(saved);
    }

    public List<AdminApprovalResponse> listApprovals(String type,
                                                     String status,
                                                     Integer minRiskScore,
                                                     String query) {
        String normalizedType = normalizeOptional(type);
        String normalizedStatus = normalizeOptional(status);
        String normalizedQuery = normalizeOptional(query);
        return approvalRepository.findAllByOrderByRequestedAtDesc()
                .stream()
                .filter(approval -> normalizedType == null
                        || normalizedType.equalsIgnoreCase(approval.getApprovalType()))
                .filter(approval -> normalizedStatus == null
                        || normalizedStatus.equalsIgnoreCase(approval.getStatus()))
                .filter(approval -> minRiskScore == null
                        || (approval.getRiskScore() != null && approval.getRiskScore() >= minRiskScore))
                .filter(approval -> matchesQuery(approval, normalizedQuery))
                .map(this::toResponse)
                .toList();
    }

    public AdminApprovalResponse getApproval(Long id) {
        AdminApproval approval = approvalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Approval item not found"));
        return toResponse(approval);
    }

    private boolean matchesQuery(AdminApproval approval, String query) {
        if (query == null) {
            return true;
        }
        String needle = query.toLowerCase();
        return contains(approval.getApprovalType(), needle)
                || contains(approval.getStatus(), needle)
                || contains(approval.getUserId(), needle)
                || contains(approval.getUserName(), needle)
                || contains(approval.getLoanId(), needle)
                || contains(approval.getQueue(), needle);
    }

    private boolean contains(String value, String query) {
        return value != null && value.toLowerCase().contains(query);
    }

    private AdminApprovalResponse toResponse(AdminApproval approval) {
        return new AdminApprovalResponse(
            approval.getId(),
            approval.getApprovalType(),
            approval.getStatus(),
            approval.getUserId(),
                approval.getUserName(),
                approval.getRiskScore(),
                approval.getAmount(),
                approval.getLoanId(),
                approval.getQueue(),
                approval.getRequestedAt(),
            approval.getUpdatedAt()
        );
    }

    AdminApprovalResponse toResponseForSearch(AdminApproval approval) {
        return toResponse(approval);
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
