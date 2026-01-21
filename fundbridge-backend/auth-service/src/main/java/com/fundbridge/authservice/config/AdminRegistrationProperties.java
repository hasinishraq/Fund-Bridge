package com.fundbridge.authservice.config;

import jakarta.validation.constraints.AssertTrue;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.admin-registration")
public class AdminRegistrationProperties {

    private boolean enabled = false;
    private String secret;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    @AssertTrue(message = "app.admin-registration.secret must be provided when admin registration is enabled")
    public boolean isSecretPresentWhenEnabled() {
        return !enabled || StringUtils.hasText(secret);
    }
}
