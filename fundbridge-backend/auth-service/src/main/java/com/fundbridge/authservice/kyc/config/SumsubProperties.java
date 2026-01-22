package com.fundbridge.authservice.kyc.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "sumsub")
public class SumsubProperties {

    /**
     * Allows disabling outbound calls so local environments can mock responses.
     */
    private boolean enabled = false;

    private String baseUrl = "https://api.sumsub.com";

    private String appToken;

    private String secretKey;

    private String levelName = "fundbridge-default";

    private int websdkTtlSeconds = 900;

    /**
     * Optional link to return when outbound KYC is disabled or fails.
     * Helps frontends continue the flow in non-integrated environments.
     */
    private String stubReviewUrl;

    /**
     * Optional webhook secret for verifying Sumsub webhook signatures.
     */
    private String webhookSecret;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getAppToken() {
        return appToken;
    }

    public void setAppToken(String appToken) {
        this.appToken = appToken;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getLevelName() {
        return levelName;
    }

    public void setLevelName(String levelName) {
        this.levelName = levelName;
    }

    public int getWebsdkTtlSeconds() {
        return websdkTtlSeconds;
    }

    public void setWebsdkTtlSeconds(int websdkTtlSeconds) {
        this.websdkTtlSeconds = websdkTtlSeconds;
    }

    public String getStubReviewUrl() {
        return stubReviewUrl;
    }

    public void setStubReviewUrl(String stubReviewUrl) {
        this.stubReviewUrl = stubReviewUrl;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public void setWebhookSecret(String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }
}
