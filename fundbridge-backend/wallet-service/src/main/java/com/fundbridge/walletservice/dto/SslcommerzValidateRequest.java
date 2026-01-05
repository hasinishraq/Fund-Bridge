package com.fundbridge.walletservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SslcommerzValidateRequest(
        @NotBlank(message = "tranId is required")
        String tranId,
        @NotNull(message = "User ID is required")
        Long userId,
        String valId
) {
}
