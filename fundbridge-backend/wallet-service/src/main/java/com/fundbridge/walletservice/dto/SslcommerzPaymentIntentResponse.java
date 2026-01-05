package com.fundbridge.walletservice.dto;

import com.fundbridge.walletservice.entity.PaymentIntentStatus;

import java.math.BigDecimal;

public record SslcommerzPaymentIntentResponse(
        String tranId,
        String redirectUrl,
        PaymentIntentStatus status,
        BigDecimal amount,
        String currency,
        Long walletAccountId,
        Long walletTransactionId,
        String message
) {
}
