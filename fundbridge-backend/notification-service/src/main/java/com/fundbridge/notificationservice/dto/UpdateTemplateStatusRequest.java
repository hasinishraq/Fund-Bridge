package com.fundbridge.notificationservice.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateTemplateStatusRequest(
        @NotNull(message = "Active status is required")
        Boolean active
) {
}
