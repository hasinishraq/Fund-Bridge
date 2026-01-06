package com.fundbridge.walletservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StripeConfirmRequest(
        @NotBlank(message = "paymentIntentId is required")
        String paymentIntentId,
        @NotNull(message = "User ID is required")
        Long userId
) {
}
