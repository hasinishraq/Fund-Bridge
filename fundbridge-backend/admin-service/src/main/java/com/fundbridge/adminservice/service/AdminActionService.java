package com.fundbridge.adminservice.service;

import com.fundbridge.adminservice.dto.AdminActionResponse;
import com.fundbridge.adminservice.dto.CreateAdminActionRequest;
import com.fundbridge.adminservice.entity.AdminAction;
import com.fundbridge.adminservice.entity.AdminActionType;
import com.fundbridge.adminservice.entity.AdminTargetType;
import com.fundbridge.adminservice.exception.ResourceNotFoundException;
import com.fundbridge.adminservice.repository.AdminActionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdminActionService {

    private final AdminActionRepository actionRepository;

    public AdminActionService(AdminActionRepository actionRepository) {
        this.actionRepository = actionRepository;
    }

    @Transactional
    public AdminActionResponse createAction(CreateAdminActionRequest request) {
        AdminAction action = new AdminAction();
        action.setAdminUserId(request.adminUserId());
        action.setActionType(request.actionType());
        action.setTargetType(request.targetType());
        action.setTargetRef(request.targetRef().trim());
        action.setReason(normalizeOptional(request.reason()));
        AdminAction saved = actionRepository.save(action);
        return toResponse(saved);
    }

    public List<AdminActionResponse> listActions(Long adminUserId,
                                                 AdminActionType actionType,
                                                 AdminTargetType targetType,
                                                 String targetRef) {
        String normalizedTargetRef = normalizeOptional(targetRef);
        return actionRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(action -> adminUserId == null || adminUserId.equals(action.getAdminUserId()))
                .filter(action -> actionType == null || actionType == action.getActionType())
                .filter(action -> targetType == null || targetType == action.getTargetType())
                .filter(action -> normalizedTargetRef == null || normalizedTargetRef.equals(action.getTargetRef()))
                .map(this::toResponse)
                .toList();
    }

    public AdminActionResponse getAction(Long id) {
        AdminAction action = actionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admin action not found"));
        return toResponse(action);
    }

    private AdminActionResponse toResponse(AdminAction action) {
        return new AdminActionResponse(
                action.getId(),
                action.getAdminUserId(),
                action.getActionType(),
                action.getTargetType(),
                action.getTargetRef(),
                action.getReason(),
                action.getCreatedAt()
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
