package com.fundbridge.authservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "brevo")
public class BrevoProperties {

    /**
     * Toggle email sending; useful for local development.
     */
    private boolean enabled = true;
    private String apiKey;
    private String baseUrl = "https://api.brevo.com";
    private String fromEmail;
    private String fromName = "FundBridge";
    private String otpSubject = "Your verification code";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getFromEmail() {
        return fromEmail;
    }

    public void setFromEmail(String fromEmail) {
        this.fromEmail = fromEmail;
    }

    public String getFromName() {
        return fromName;
    }

    public void setFromName(String fromName) {
        this.fromName = fromName;
    }

    public String getOtpSubject() {
        return otpSubject;
    }

    public void setOtpSubject(String otpSubject) {
        this.otpSubject = otpSubject;
    }
}
