package com.fundbridge.loanmanagementservice.controller;

import com.fundbridge.loanmanagementservice.dto.EmiScheduleItem;
import com.fundbridge.loanmanagementservice.dto.EmiScheduleRequest;
import com.fundbridge.loanmanagementservice.dto.FundingMatchResponse;
import com.fundbridge.loanmanagementservice.dto.LoanApplicationRequest;
import com.fundbridge.loanmanagementservice.dto.LoanApplicationResponse;
import com.fundbridge.loanmanagementservice.service.LoanApplicationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/loans")
@Validated
public class LoanController {

    private final LoanApplicationService loanApplicationService;

    public LoanController(LoanApplicationService loanApplicationService) {
        this.loanApplicationService = loanApplicationService;
    }

    @PostMapping("/applications")
    public ResponseEntity<LoanApplicationResponse> createApplication(@Valid @RequestBody LoanApplicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(loanApplicationService.submit(request));
    }

    @PostMapping("/schedule")
    public ResponseEntity<List<EmiScheduleItem>> schedule(@Valid @RequestBody EmiScheduleRequest request) {
        return ResponseEntity.ok(loanApplicationService.schedule(request));
    }

    @GetMapping("/applications/{applicationId}/funding-matches")
    public ResponseEntity<FundingMatchResponse> fundingMatches(@PathVariable String applicationId,
                                                               @RequestParam
                                                               @DecimalMin(value = "1000.00", message = "Amount must be at least 1000")
                                                               BigDecimal amount) {
        return ResponseEntity.ok(loanApplicationService.fundingMatches(applicationId, amount));
    }
}
