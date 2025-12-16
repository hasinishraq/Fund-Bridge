package com.fundbridge.walletservice.dto;

import com.fundbridge.walletservice.entity.TransactionType;

public record CaptureHoldRequest(
        TransactionType transactionType,
        String referenceType,
        String referenceId,
        String idempotencyKey
) {
}
