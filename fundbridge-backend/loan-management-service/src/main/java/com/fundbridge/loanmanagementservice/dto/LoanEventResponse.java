package com.fundbridge.loanmanagementservice.dto;

import java.time.Instant;

public record LoanEventResponse(
        Long id,
        String eventType,
        Long actorUserId,
        String details,
        Instant createdAt
) {
}
