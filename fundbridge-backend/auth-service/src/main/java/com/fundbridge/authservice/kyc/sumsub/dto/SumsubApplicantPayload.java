package com.fundbridge.authservice.kyc.sumsub.dto;

public record SumsubApplicantPayload(
        String externalUserId,
        String email,
        String type,
        ApplicantInfo info
) {
    public record ApplicantInfo(
            String firstName,
            String lastName
    ) {
    }
}
