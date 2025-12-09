package com.fundbridge.kycservice.sumsub.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record SumsubWebSdkLinkRequest(
        @JsonProperty("userId")
        String userId,
        @JsonProperty("levelName")
        String levelName,
        @JsonProperty("ttlInSecs")
        int ttlInSecs
) {
}
