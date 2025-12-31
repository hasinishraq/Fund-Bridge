package com.fundbridge.walletservice.dto;

import com.fundbridge.walletservice.entity.PaymentIntentStatus;

import java.math.BigDecimal;

public record StripePaymentIntentResponse(
        String paymentIntentId,
        String clientSecret,
        String publishableKey,
        BigDecimal amount,
        String currency,
        PaymentIntentStatus status,
        Long walletAccountId,
        Long walletTransactionId
) {
}
