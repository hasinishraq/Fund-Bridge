package com.fundbridge.loanmanagementservice.controller;

import com.fundbridge.loanmanagementservice.dto.CreditScoreResponse;
import com.fundbridge.loanmanagementservice.service.LoanApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/credit")
public class CreditScoreController {

    private final LoanApplicationService loanApplicationService;

    public CreditScoreController(LoanApplicationService loanApplicationService) {
        this.loanApplicationService = loanApplicationService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<CreditScoreResponse> getCreditScore(@PathVariable Long userId) {
        return ResponseEntity.ok(loanApplicationService.creditScore(userId));
    }
}
