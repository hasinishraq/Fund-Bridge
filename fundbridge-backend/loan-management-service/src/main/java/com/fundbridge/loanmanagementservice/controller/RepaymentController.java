package com.fundbridge.loanmanagementservice.controller;

import com.fundbridge.loanmanagementservice.dto.InstallmentResponse;
import com.fundbridge.loanmanagementservice.dto.PayInstallmentRequest;
import com.fundbridge.loanmanagementservice.service.RepaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/repayments")
@Validated
public class RepaymentController {

    private final RepaymentService repaymentService;

    public RepaymentController(RepaymentService repaymentService) {
        this.repaymentService = repaymentService;
    }

    @GetMapping("/loans/{loanId}/installments")
    public ResponseEntity<List<InstallmentResponse>> installments(@PathVariable Long loanId) {
        return ResponseEntity.ok(repaymentService.listInstallments(loanId));
    }

    @PostMapping("/installments/{installmentId}/pay")
    public ResponseEntity<InstallmentResponse> pay(@PathVariable Long installmentId,
                                                   @Valid @RequestBody(required = false) PayInstallmentRequest request) {
        PayInstallmentRequest payload = request != null ? request : new PayInstallmentRequest(null);
        return ResponseEntity.ok(repaymentService.markPaid(installmentId, payload));
    }
}
