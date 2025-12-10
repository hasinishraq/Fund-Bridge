package com.fundbridge.authservice.kyc.sumsub.dto;

public record SumsubApplicantResponse(
        String id,
        String createdAt,
        String inspectionId,
        Review review
) {
    public record Review(
            String reviewStatus,
            ReviewResult reviewResult
    ) {
    }

    public record ReviewResult(
            String reviewAnswer
    ) {
    }
}
