package com.fundbridge.walletservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "stripe")
public class StripeProperties {

    /**
     * Secret key from the Stripe dashboard (sk_test.../sk_live...).
     */
    private String secretKey;

    /**
     * Publishable key used by the frontend (pk_test.../pk_live...).
     */
    private String publishableKey;

    /**
     * Signing secret for the configured webhook endpoint.
     */
    private String webhookSecret;

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getPublishableKey() {
        return publishableKey;
    }

    public void setPublishableKey(String publishableKey) {
        this.publishableKey = publishableKey;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public void setWebhookSecret(String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }
}
