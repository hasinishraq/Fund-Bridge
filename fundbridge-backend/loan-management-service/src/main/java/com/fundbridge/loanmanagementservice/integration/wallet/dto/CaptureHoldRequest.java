package com.fundbridge.loanmanagementservice.integration.wallet.dto;

public record CaptureHoldRequest(
        WalletTransactionType transactionType,
        String referenceType,
        String referenceId,
        String idempotencyKey,
        String metadata
) {
}
