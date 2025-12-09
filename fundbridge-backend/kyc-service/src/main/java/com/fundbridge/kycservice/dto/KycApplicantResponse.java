package com.fundbridge.kycservice.dto;

import com.fundbridge.kycservice.model.KycStatus;

public record KycApplicantResponse(
        String applicantId,
        KycStatus status,
        String reviewUrl
) {
}
