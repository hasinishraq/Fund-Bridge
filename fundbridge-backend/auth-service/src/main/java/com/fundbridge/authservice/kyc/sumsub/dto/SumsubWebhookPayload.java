package com.fundbridge.authservice.kyc.sumsub.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SumsubWebhookPayload(
        @JsonProperty("type")
        String type,
        @JsonProperty("applicantId")
        String applicantId,
        @JsonProperty("externalUserId")
        String externalUserId,
        @JsonProperty("reviewStatus")
        String reviewStatus,
        @JsonProperty("reviewResult")
        ReviewResult reviewResult
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ReviewResult(
            @JsonProperty("reviewAnswer")
            String reviewAnswer,
            @JsonProperty("reviewRejectType")
            String reviewRejectType
    ) {
    }
}
