package com.fundbridge.authservice.client.kyc;

import com.fundbridge.authservice.entity.KycStatus;

public record KycApplicantResponse(
        String applicantId,
        KycStatus status,
        String reviewUrl
) {
}
