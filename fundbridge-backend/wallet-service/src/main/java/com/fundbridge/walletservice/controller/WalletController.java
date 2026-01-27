package com.fundbridge.walletservice.controller;

import com.fundbridge.walletservice.dto.CaptureHoldRequest;
import com.fundbridge.walletservice.dto.CreateHoldRequest;
import com.fundbridge.walletservice.dto.CreateWalletRequest;
import com.fundbridge.walletservice.dto.ReleaseHoldRequest;
import com.fundbridge.walletservice.dto.TransferRequest;
import com.fundbridge.walletservice.dto.WalletMetricsResponse;
import com.fundbridge.walletservice.dto.WalletHoldResponse;
import com.fundbridge.walletservice.dto.WalletSummaryResponse;
import com.fundbridge.walletservice.dto.WalletTopUpRequest;
import com.fundbridge.walletservice.dto.WalletTransactionResponse;
import com.fundbridge.walletservice.service.WalletMetricsService;
import com.fundbridge.walletservice.service.WalletService;
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
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/wallet")
@Validated
public class WalletController {

    private final WalletService walletService;
    private final WalletMetricsService metricsService;

    public WalletController(WalletService walletService, WalletMetricsService metricsService) {
        this.walletService = walletService;
        this.metricsService = metricsService;
    }

    @GetMapping
    public ResponseEntity<WalletSummaryResponse> getWallet(@RequestParam(value = "userId", required = false) Long userId,
                                                           @RequestParam(value = "currency", required = false) String currency) {
        return ResponseEntity.ok(walletService.getWallet(userId, currency));
    }

    @PostMapping
    public ResponseEntity<WalletSummaryResponse> createWallet(@Valid @RequestBody CreateWalletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(walletService.createWallet(request));
    }

    @PostMapping("/top-up")
    public ResponseEntity<WalletSummaryResponse> topUp(@Valid @RequestBody WalletTopUpRequest request) {
        return ResponseEntity.ok(walletService.topUp(request));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransactionResponse>> transactions(@RequestParam(value = "userId", required = false) Long userId,
                                                                        @RequestParam(value = "currency", required = false) String currency) {
        return ResponseEntity.ok(walletService.listTransactions(userId, currency));
    }

    @GetMapping("/metrics")
    public ResponseEntity<WalletMetricsResponse> metrics(
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(value = "currency", required = false) String currency) {
        return ResponseEntity.ok(metricsService.getMetrics(date, currency));
    }

    @PostMapping("/transfer")
    public ResponseEntity<WalletTransactionResponse> transfer(@Valid @RequestBody TransferRequest request) {
        return ResponseEntity.ok(walletService.transfer(request));
    }

    @PostMapping("/holds")
    public ResponseEntity<WalletHoldResponse> createHold(@Valid @RequestBody CreateHoldRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(walletService.createHold(request));
    }

    @PostMapping("/holds/{holdId}/release")
    public ResponseEntity<WalletHoldResponse> releaseHold(@PathVariable Long holdId,
                                                          @RequestBody(required = false) ReleaseHoldRequest request) {
        ReleaseHoldRequest payload = request != null ? request : new ReleaseHoldRequest(null);
        return ResponseEntity.ok(walletService.releaseHold(holdId, payload));
    }

    @PostMapping("/holds/{holdId}/capture")
    public ResponseEntity<WalletTransactionResponse> captureHold(@PathVariable Long holdId,
                                                                 @RequestBody(required = false) CaptureHoldRequest request) {
        CaptureHoldRequest payload = request != null ? request : new CaptureHoldRequest(null, null, null, null, null);
        return ResponseEntity.ok(walletService.captureHold(holdId, payload));
    }
}
