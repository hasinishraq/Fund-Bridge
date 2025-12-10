package com.fundbridge.loanmanagementservice.dto;

import java.math.BigDecimal;
import java.util.List;

public record FundingMatchResponse(
        String applicationId,
        BigDecimal totalRequested,
        List<FundingMatch> matches
) {
}
