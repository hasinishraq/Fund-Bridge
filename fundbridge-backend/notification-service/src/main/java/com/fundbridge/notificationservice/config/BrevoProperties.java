package com.fundbridge.notificationservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "brevo")
public class BrevoProperties {

    private boolean enabled = true;
    private String apiKey;
    private String baseUrl = "https://api.brevo.com";
    private String fromEmail;
    private String fromName = "FundBridge";
    private String defaultSubject = "FundBridge notification";

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

    public String getDefaultSubject() {
        return defaultSubject;
    }

    public void setDefaultSubject(String defaultSubject) {
        this.defaultSubject = defaultSubject;
    }
}
