package com.fundbridge.walletservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "sslcommerz")
public class SslcommerzProperties {

    /**
     * Enable or disable SSLCommerz funding.
     */
    private boolean enabled = false;

    /**
     * Store credentials from SSLCommerz.
     */
    private String storeId;
    private String storePassword;

    /**
     * Base URL for hosted checkout (sandbox or live).
     */
    private String apiBaseUrl = "https://sandbox.sslcommerz.com";

    /**
     * Callback URLs.
     */
    private String successUrl = "http://localhost:8091/payments/sslcommerz/complete";
    private String failUrl = "http://localhost:8091/payments/sslcommerz/fail";
    private String cancelUrl = "http://localhost:8091/payments/sslcommerz/cancel";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getStoreId() {
        return storeId;
    }

    public void setStoreId(String storeId) {
        this.storeId = storeId;
    }

    public String getStorePassword() {
        return storePassword;
    }

    public void setStorePassword(String storePassword) {
        this.storePassword = storePassword;
    }

    public String getApiBaseUrl() {
        return apiBaseUrl;
    }

    public void setApiBaseUrl(String apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
    }

    public String getSuccessUrl() {
        return successUrl;
    }

    public void setSuccessUrl(String successUrl) {
        this.successUrl = successUrl;
    }

    public String getFailUrl() {
        return failUrl;
    }

    public void setFailUrl(String failUrl) {
        this.failUrl = failUrl;
    }

    public String getCancelUrl() {
        return cancelUrl;
    }

    public void setCancelUrl(String cancelUrl) {
        this.cancelUrl = cancelUrl;
    }
}
