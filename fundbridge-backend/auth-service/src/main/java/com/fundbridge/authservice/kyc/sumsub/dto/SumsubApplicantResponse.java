package com.fundbridge.authservice.kyc.sumsub.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SumsubApplicantResponse(
        @JsonProperty("id")
        String id,
        @JsonProperty("externalUserId")
        String externalUserId,
        @JsonProperty("review")
        Review review
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Review(
            @JsonProperty("reviewStatus")
            String reviewStatus,
            @JsonProperty("reviewResult")
            ReviewResult reviewResult
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ReviewResult(
            @JsonProperty("reviewAnswer")
            String reviewAnswer
    ) {
    }
}
