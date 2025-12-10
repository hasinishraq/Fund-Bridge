package com.fundbridge.authservice.kyc.sumsub.dto;

public record SumsubWebSdkLinkRequest(
        String externalUserId,
        String levelName,
        int ttlInSecs
) {
}
