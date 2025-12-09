package com.fundbridge.authservice.client.kyc;

public record CreateKycApplicantRequest(
        Long userId,
        String fullName,
        String email
) {
}
