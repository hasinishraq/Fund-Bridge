package com.fundbridge.adminservice.dto;

import com.fundbridge.adminservice.entity.AdminActionType;
import com.fundbridge.adminservice.entity.AdminTargetType;

import java.time.Instant;

public record AdminActionResponse(
        Long id,
        Long adminUserId,
        AdminActionType actionType,
        AdminTargetType targetType,
        String targetRef,
        String reason,
        Instant createdAt
) {
}
