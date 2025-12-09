package com.fundbridge.kycservice.controller;

import com.fundbridge.kycservice.dto.CreateApplicantRequest;
import com.fundbridge.kycservice.dto.KycApplicantResponse;
import com.fundbridge.kycservice.service.KycApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/kyc")
public class KycController {

    private final KycApplicationService applicationService;

    public KycController(KycApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping("/applicants")
    public ResponseEntity<KycApplicantResponse> createApplicant(@Valid @RequestBody CreateApplicantRequest request) {
        KycApplicantResponse response = applicationService.createApplicant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
