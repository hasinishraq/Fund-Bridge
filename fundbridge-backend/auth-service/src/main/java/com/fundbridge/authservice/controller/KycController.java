package com.fundbridge.authservice.controller;

import com.fundbridge.authservice.entity.UserRole;
import com.fundbridge.authservice.exception.KycIntegrationException;
import com.fundbridge.authservice.kyc.KycApplicationService;
import com.fundbridge.authservice.kyc.dto.CreateApplicantRequest;
import com.fundbridge.authservice.kyc.dto.KycApplicantResponse;
import com.fundbridge.authservice.service.UserService;
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
import org.springframework.util.StringUtils;

import java.time.Instant;

@RestController
@RequestMapping("/kyc")
@PreAuthorize("hasAnyRole('ADMIN','BORROWER','LENDER')")
public class KycController {

    private final KycApplicationService kycApplicationService;
    private final UserService userService;

    public KycController(KycApplicationService kycApplicationService, UserService userService) {
        this.kycApplicationService = kycApplicationService;
        this.userService = userService;
    }

    @PostMapping("/applicants")
    public ResponseEntity<KycApplicantResponse> createApplicant(@AuthenticationPrincipal UserPrincipal principal,
                                                                @Valid @RequestBody CreateApplicantRequest request) {
        CreateApplicantRequest resolvedRequest = resolveRequest(principal, request);
        try {
            KycApplicantResponse response = kycApplicationService.createApplicant(resolvedRequest);
            persistKyc(resolvedRequest.userId(), response);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception exception) {
            throw new KycIntegrationException("Failed to start KYC verification", exception);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<KycApplicantResponse> refreshApplicant(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new KycIntegrationException("Authenticated user context required for KYC");
        }
        var user = userService.findById(principal.getUser().getId())
                .orElseThrow(() -> new KycIntegrationException("User not found"));
        if (!StringUtils.hasText(user.getKycApplicantId())) {
            throw new KycIntegrationException("KYC applicant not found. Start verification first.");
        }
        String externalUserId = "fundbridge-user-" + user.getId();
        try {
            KycApplicantResponse response = kycApplicationService.refreshApplicant(
                    user.getKycApplicantId(),
                    externalUserId
            );
            persistKyc(user.getId(), response);
            return ResponseEntity.ok(response);
        } catch (Exception exception) {
            throw new KycIntegrationException("Failed to refresh KYC verification", exception);
        }
    }

    private CreateApplicantRequest resolveRequest(UserPrincipal principal, CreateApplicantRequest request) {
        if (principal != null && principal.getUser().getPrimaryRole() == UserRole.ADMIN) {
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

    private void persistKyc(Long userId, KycApplicantResponse response) {
        if (userId == null || response == null || response.applicantId() == null) {
            return;
        }
        userService.findById(userId).ifPresent(user -> {
            user.setKycApplicantId(response.applicantId());
            if (response.status() != null) {
                user.setKycStatus(response.status());
            }
            if (StringUtils.hasText(response.reviewUrl())) {
                user.setKycReviewUrl(response.reviewUrl());
            }
            user.setKycLastSyncedAt(Instant.now());
            userService.save(user);
        });
    }
}
