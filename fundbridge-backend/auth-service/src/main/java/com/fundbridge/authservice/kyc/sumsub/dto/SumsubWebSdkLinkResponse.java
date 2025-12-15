package com.fundbridge.authservice.kyc.sumsub.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SumsubWebSdkLinkResponse(
        @JsonProperty("url")
        String url
) {
}
