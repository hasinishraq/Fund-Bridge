package com.fundbridge.walletservice.controller;

import com.fundbridge.walletservice.dto.SslcommerzPaymentIntentResponse;
import com.fundbridge.walletservice.dto.SslcommerzTopUpRequest;
import com.fundbridge.walletservice.dto.SslcommerzValidateRequest;
import com.fundbridge.walletservice.service.SslcommerzPaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments/sslcommerz")
@Validated
public class SslcommerzPaymentController {

    private final SslcommerzPaymentService sslcommerzPaymentService;

    public SslcommerzPaymentController(SslcommerzPaymentService sslcommerzPaymentService) {
        this.sslcommerzPaymentService = sslcommerzPaymentService;
    }

    @PostMapping("/top-up")
    public ResponseEntity<SslcommerzPaymentIntentResponse> createTopUpIntent(@Valid @RequestBody SslcommerzTopUpRequest request) {
        return ResponseEntity.ok(sslcommerzPaymentService.createTopUpIntent(request));
    }

    @PostMapping("/validate")
    public ResponseEntity<SslcommerzPaymentIntentResponse> validate(@Valid @RequestBody SslcommerzValidateRequest request) {
        return ResponseEntity.ok(sslcommerzPaymentService.validate(request));
    }

    @RequestMapping(value = "/complete", method = {org.springframework.web.bind.annotation.RequestMethod.GET, org.springframework.web.bind.annotation.RequestMethod.POST})
    public ResponseEntity<String> handleComplete(@RequestParam("tran_id") String tranId,
                                                 @RequestParam(value = "val_id", required = false) String valId,
                                                 @RequestParam(value = "value_a", required = false) String userIdStr) {
        Long userId = null;
        try {
            if (userIdStr != null && !userIdStr.isBlank()) {
                userId = Long.parseLong(userIdStr.trim());
            }
        } catch (NumberFormatException ignored) {
        }
        if (userId != null) {
            sslcommerzPaymentService.validate(new SslcommerzValidateRequest(tranId, userId, valId));
        }
        return ResponseEntity.ok("received");
    }

    @RequestMapping(value = {"/fail", "/cancel"}, method = {org.springframework.web.bind.annotation.RequestMethod.GET, org.springframework.web.bind.annotation.RequestMethod.POST})
    public ResponseEntity<String> handleFallback() {
        return ResponseEntity.ok("received");
    }
}
