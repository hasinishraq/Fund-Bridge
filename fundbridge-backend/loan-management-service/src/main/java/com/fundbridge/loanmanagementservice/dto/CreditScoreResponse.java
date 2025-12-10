package com.fundbridge.loanmanagementservice.dto;

import java.time.Instant;

public record CreditScoreResponse(
        Long userId,
        int score,
        String grade,
        Instant lastUpdated
) {
}
