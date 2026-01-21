package com.fundbridge.adminservice.dto;

import com.fundbridge.adminservice.entity.AdminActionType;
import com.fundbridge.adminservice.entity.AdminTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAdminActionRequest(
        @NotNull(message = "Admin user id is required")
        Long adminUserId,
        @NotNull(message = "Action type is required")
        AdminActionType actionType,
        @NotNull(message = "Target type is required")
        AdminTargetType targetType,
        @NotBlank(message = "Target reference is required")
        @Size(max = 120, message = "Target reference must be at most 120 characters")
        String targetRef,
        @Size(max = 255, message = "Reason must be at most 255 characters")
        String reason
) {
}
