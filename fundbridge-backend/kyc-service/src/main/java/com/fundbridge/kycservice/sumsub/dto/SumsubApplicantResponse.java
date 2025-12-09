package com.fundbridge.kycservice.sumsub.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SumsubApplicantResponse(
        @JsonProperty("id")
        String id,
        @JsonProperty("externalUserId")
        String externalUserId,
        @JsonProperty("review")
        SumsubReview review
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SumsubReview(
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
