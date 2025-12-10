package com.fundbridge.authservice.kyc.dto;

import com.fundbridge.authservice.entity.KycStatus;

public record KycApplicantResponse(
        String applicantId,
        KycStatus status,
        String reviewUrl
) {
}
