package com.fundbridge.loanmanagementservice.controller;

import com.fundbridge.loanmanagementservice.dto.CreateLoanRequest;
import com.fundbridge.loanmanagementservice.dto.EmiScheduleItem;
import com.fundbridge.loanmanagementservice.dto.EmiScheduleRequest;
import com.fundbridge.loanmanagementservice.dto.InstallmentResponse;
import com.fundbridge.loanmanagementservice.dto.LoanDetailResponse;
import com.fundbridge.loanmanagementservice.dto.LoanResponse;
import com.fundbridge.loanmanagementservice.dto.UpdateLoanStatusRequest;
import com.fundbridge.loanmanagementservice.service.LoanApplicationService;
import com.fundbridge.loanmanagementservice.service.LoanService;
import com.fundbridge.loanmanagementservice.service.RepaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/loans")
@Validated
public class LoanController {

    private final LoanService loanService;
    private final RepaymentService repaymentService;
    private final LoanApplicationService loanApplicationService;

    public LoanController(LoanService loanService,
                          RepaymentService repaymentService,
                          LoanApplicationService loanApplicationService) {
        this.loanService = loanService;
        this.repaymentService = repaymentService;
        this.loanApplicationService = loanApplicationService;
    }

    @GetMapping
    public ResponseEntity<List<LoanResponse>> list(@RequestParam(value = "borrowerId", required = false) Long borrowerId) {
        return ResponseEntity.ok(loanService.listLoans(borrowerId));
    }

    @PostMapping
    public ResponseEntity<LoanResponse> create(@Valid @RequestBody CreateLoanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(loanService.createLoan(request));
    }

    @GetMapping("/{loanId}")
    public ResponseEntity<LoanDetailResponse> get(@PathVariable Long loanId) {
        return ResponseEntity.ok(loanService.getLoanDetail(loanId));
    }

    @PatchMapping("/{loanId}")
    public ResponseEntity<LoanResponse> updateStatus(@PathVariable Long loanId,
                                                     @Valid @RequestBody UpdateLoanStatusRequest request) {
        return ResponseEntity.ok(loanService.updateStatus(loanId, request));
    }

    @GetMapping("/{loanId}/installments")
    public ResponseEntity<List<InstallmentResponse>> installments(@PathVariable Long loanId) {
        return ResponseEntity.ok(repaymentService.listInstallments(loanId));
    }

    @PostMapping("/schedule")
    public ResponseEntity<List<EmiScheduleItem>> schedule(@Valid @RequestBody EmiScheduleRequest request) {
        return ResponseEntity.ok(loanApplicationService.schedule(request));
    }
}
