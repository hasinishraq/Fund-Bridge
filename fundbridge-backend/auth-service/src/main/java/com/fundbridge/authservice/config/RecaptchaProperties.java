package com.fundbridge.authservice.config;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import org.springframework.util.StringUtils;

@Validated
@ConfigurationProperties(prefix = "app.recaptcha")
public class RecaptchaProperties {

    private boolean enabled = false;
    private String secretKey;
    private String verifyUrl = "https://www.google.com/recaptcha/api/siteverify";

    @DecimalMin("0.0")
    @DecimalMax("1.0")
    private double minimumScore = 0.5;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getVerifyUrl() {
        return verifyUrl;
    }

    public void setVerifyUrl(String verifyUrl) {
        this.verifyUrl = verifyUrl;
    }

    public double getMinimumScore() {
        return minimumScore;
    }

    public void setMinimumScore(double minimumScore) {
        this.minimumScore = minimumScore;
    }

    @AssertTrue(message = "app.recaptcha.secret-key must be provided when reCAPTCHA is enabled")
    public boolean isSecretPresentWhenEnabled() {
        return !enabled || StringUtils.hasText(secretKey);
    }
}
