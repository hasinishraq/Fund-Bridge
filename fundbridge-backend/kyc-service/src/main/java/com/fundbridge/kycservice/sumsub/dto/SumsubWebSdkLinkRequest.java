package com.fundbridge.kycservice.sumsub.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record SumsubWebSdkLinkRequest(
        @JsonProperty("externalUserId")
        String externalUserId,
        @JsonProperty("levelName")
        String levelName,
        @JsonProperty("ttlInSecs")
        int ttlInSecs
) {
}
