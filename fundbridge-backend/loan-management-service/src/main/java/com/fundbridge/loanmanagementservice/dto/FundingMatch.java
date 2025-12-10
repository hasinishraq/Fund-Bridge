package com.fundbridge.loanmanagementservice.dto;

import java.math.BigDecimal;

public record FundingMatch(
        Long investorId,
        BigDecimal amount,
        double confidence
) {
}
