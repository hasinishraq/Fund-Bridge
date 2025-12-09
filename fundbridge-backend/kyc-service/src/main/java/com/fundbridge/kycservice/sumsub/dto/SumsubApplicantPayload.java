package com.fundbridge.kycservice.sumsub.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record SumsubApplicantPayload(
        @JsonProperty("externalUserId")
        String externalUserId,
        @JsonProperty("email")
        String email,
        @JsonProperty("type")
        String type,
        @JsonProperty("info")
        ApplicantInfo info
) {

    public record ApplicantInfo(
            @JsonProperty("firstName")
            String firstName,
            @JsonProperty("lastName")
            String lastName
    ) {
    }
}
