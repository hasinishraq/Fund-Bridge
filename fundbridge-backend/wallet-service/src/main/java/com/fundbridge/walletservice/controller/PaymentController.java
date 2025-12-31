package com.fundbridge.walletservice.controller;

import com.fundbridge.walletservice.dto.StripePaymentIntentResponse;
import com.fundbridge.walletservice.dto.StripeTopUpRequest;
import com.fundbridge.walletservice.service.StripePaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments/stripe")
@Validated
public class PaymentController {

    private final StripePaymentService stripePaymentService;

    public PaymentController(StripePaymentService stripePaymentService) {
        this.stripePaymentService = stripePaymentService;
    }

    @PostMapping("/top-up")
    public ResponseEntity<StripePaymentIntentResponse> createTopUpIntent(@Valid @RequestBody StripeTopUpRequest request) {
        return ResponseEntity.ok(stripePaymentService.createTopUpIntent(request));
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestHeader("Stripe-Signature") String signature,
                                                @RequestBody String payload) {
        stripePaymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok("received");
    }
}
