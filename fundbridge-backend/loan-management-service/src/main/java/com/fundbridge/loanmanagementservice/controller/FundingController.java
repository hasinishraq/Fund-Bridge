package com.fundbridge.loanmanagementservice.controller;

import com.fundbridge.loanmanagementservice.dto.CreateFundingRequest;
import com.fundbridge.loanmanagementservice.dto.FundingActionRequest;
import com.fundbridge.loanmanagementservice.dto.FundingResponse;
import com.fundbridge.loanmanagementservice.service.FundingService;
import jakarta.validation.Valid;
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

import java.util.List;

@RestController
@RequestMapping("/funding")
@Validated
public class FundingController {

    private final FundingService fundingService;

    public FundingController(FundingService fundingService) {
        this.fundingService = fundingService;
    }

    @PostMapping
    public ResponseEntity<FundingResponse> pledge(@Valid @RequestBody CreateFundingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fundingService.createFunding(request));
    }

    @PostMapping("/{fundingId}/capture")
    public ResponseEntity<FundingResponse> capture(@PathVariable Long fundingId,
                                                   @RequestBody(required = false) FundingActionRequest request) {
        return ResponseEntity.ok(fundingService.captureFunding(fundingId, request));
    }

    @PostMapping("/{fundingId}/cancel")
    public ResponseEntity<FundingResponse> cancel(@PathVariable Long fundingId,
                                                  @RequestBody(required = false) FundingActionRequest request) {
        return ResponseEntity.ok(fundingService.cancelFunding(fundingId, request));
    }

    @GetMapping
    public ResponseEntity<List<FundingResponse>> list(@RequestParam(value = "lenderId", required = false) Long lenderId,
                                                      @RequestParam(value = "loanId", required = false) Long loanId) {
        if (loanId != null) {
            return ResponseEntity.ok(fundingService.listFundingsForLoan(loanId));
        }
        return ResponseEntity.ok(fundingService.listFundingsForLender(lenderId));
    }
}
