package com.fundbridge.loanmanagementservice.service;

import com.fundbridge.loanmanagementservice.dto.FundingMatch;
import com.fundbridge.loanmanagementservice.dto.FundingMatchResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class FundingMatchService {

    public FundingMatchResponse findMatches(String applicationId, BigDecimal requestedAmount) {
        BigDecimal oneThird = requestedAmount.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);
        List<FundingMatch> matches = List.of(
                new FundingMatch(201L, oneThird, 0.82),
                new FundingMatch(305L, oneThird, 0.74),
                new FundingMatch(412L, requestedAmount.subtract(oneThird.multiply(BigDecimal.valueOf(2))), 0.68)
        );
        return new FundingMatchResponse(applicationId, requestedAmount, matches);
    }
}
