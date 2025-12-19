package com.fundbridge.authservice.service;

import com.fundbridge.authservice.config.BrevoProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class BrevoEmailService {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailService.class);

    private final RestTemplate restTemplate;
    private final BrevoProperties brevoProperties;

    public BrevoEmailService(RestTemplate restTemplate, BrevoProperties brevoProperties) {
        this.restTemplate = restTemplate;
        this.brevoProperties = brevoProperties;
    }

    public void sendOtpEmail(String recipientEmail, String otp, long ttlMinutes) {
        if (!brevoProperties.isEnabled()) {
            log.info("Brevo sending disabled; skipping OTP email for {}", recipientEmail);
            return;
        }
        if (brevoProperties.getApiKey() == null || brevoProperties.getApiKey().isBlank()
                || brevoProperties.getFromEmail() == null || brevoProperties.getFromEmail().isBlank()) {
            log.warn("Brevo API key or sender email not configured; skipping OTP email for {}", recipientEmail);
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoProperties.getApiKey());

            Map<String, Object> payload = Map.of(
                    "sender", Map.of(
                            "email", brevoProperties.getFromEmail(),
                            "name", brevoProperties.getFromName()
                    ),
                    "to", List.of(Map.of("email", recipientEmail)),
                    "subject", brevoProperties.getOtpSubject(),
                    "htmlContent", "<p>Your verification code is <strong>" + otp + "</strong>. " +
                            "It expires in " + ttlMinutes + " minutes.</p>"
            );

            restTemplate.postForEntity(brevoProperties.getBaseUrl() + "/v3/smtp/email",
                    new HttpEntity<>(payload, headers), Void.class);
        } catch (Exception exception) {
            log.error("Failed to send OTP email to {}", recipientEmail, exception);
        }
    }
}
