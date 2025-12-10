package com.fundbridge.loanmanagementservice.service;

import com.fundbridge.loanmanagementservice.dto.CreditScoreResponse;
import com.fundbridge.loanmanagementservice.dto.EmiScheduleItem;
import com.fundbridge.loanmanagementservice.dto.EmiScheduleRequest;
import com.fundbridge.loanmanagementservice.dto.FundingMatchResponse;
import com.fundbridge.loanmanagementservice.dto.LoanApplicationRequest;
import com.fundbridge.loanmanagementservice.dto.LoanApplicationResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class LoanApplicationService {

    private static final BigDecimal DEFAULT_RATE_PERCENT = BigDecimal.valueOf(12);

    private final CreditScoreService creditScoreService;
    private final EmiCalculatorService emiCalculatorService;
    private final FundingMatchService fundingMatchService;

    public LoanApplicationService(CreditScoreService creditScoreService,
                                  EmiCalculatorService emiCalculatorService,
                                  FundingMatchService fundingMatchService) {
        this.creditScoreService = creditScoreService;
        this.emiCalculatorService = emiCalculatorService;
        this.fundingMatchService = fundingMatchService;
    }

    public LoanApplicationResponse submit(LoanApplicationRequest request) {
        CreditScoreResponse score = creditScoreService.getScoreForUser(request.borrowerId());
        BigDecimal emi = emiCalculatorService.calculateEmi(request.amount(), DEFAULT_RATE_PERCENT, request.termMonths());
        String status = score.score() >= 700 ? "PRE_APPROVED" : "IN_REVIEW";
        return new LoanApplicationResponse(UUID.randomUUID().toString(), status, emi, score.score(), Instant.now());
    }

    public List<EmiScheduleItem> schedule(EmiScheduleRequest request) {
        return emiCalculatorService.buildSchedule(request.principal(), request.annualRatePercent(), request.termMonths());
    }

    public CreditScoreResponse creditScore(Long userId) {
        return creditScoreService.getScoreForUser(userId);
    }

    public FundingMatchResponse fundingMatches(String applicationId, BigDecimal requestedAmount) {
        return fundingMatchService.findMatches(applicationId, requestedAmount);
    }
}
