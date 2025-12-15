package com.fundbridge.authservice.controller;

import com.fundbridge.authservice.entity.UserRole;
import com.fundbridge.authservice.exception.KycIntegrationException;
import com.fundbridge.authservice.kyc.KycApplicationService;
import com.fundbridge.authservice.kyc.dto.CreateApplicantRequest;
import com.fundbridge.authservice.kyc.dto.KycApplicantResponse;
import com.fundbridge.authservice.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/kyc")
@PreAuthorize("hasAnyRole('ADMIN','BORROWER','LENDER')")
public class KycController {

    private final KycApplicationService kycApplicationService;

    public KycController(KycApplicationService kycApplicationService) {
        this.kycApplicationService = kycApplicationService;
    }

    @PostMapping("/applicants")
    public ResponseEntity<KycApplicantResponse> createApplicant(@AuthenticationPrincipal UserPrincipal principal,
                                                                @Valid @RequestBody CreateApplicantRequest request) {
        CreateApplicantRequest resolvedRequest = resolveRequest(principal, request);
        try {
            KycApplicantResponse response = kycApplicationService.createApplicant(resolvedRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception exception) {
            throw new KycIntegrationException("Failed to start KYC verification", exception);
        }
    }

    private CreateApplicantRequest resolveRequest(UserPrincipal principal, CreateApplicantRequest request) {
        if (principal != null && principal.getUser().getRole() == UserRole.ADMIN) {
            return request;
        }
        if (principal == null) {
            throw new KycIntegrationException("Authenticated user context required for KYC");
        }
        return new CreateApplicantRequest(
                principal.getUser().getId(),
                principal.getUser().getName(),
                principal.getUser().getEmail()
        );
    }
}
