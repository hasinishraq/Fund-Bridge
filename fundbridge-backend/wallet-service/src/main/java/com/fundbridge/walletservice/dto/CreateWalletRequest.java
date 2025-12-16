package com.fundbridge.walletservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateWalletRequest(
        @NotNull(message = "User ID is required")
        Long userId,
        @NotBlank(message = "Currency is required")
        String currency
) {
}
