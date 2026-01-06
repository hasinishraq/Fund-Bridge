package com.fundbridge.notificationservice.service;

import com.fundbridge.notificationservice.config.BrevoProperties;
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

    public void sendEmail(String recipientEmail, String subject, String htmlContent) {
        if (!brevoProperties.isEnabled()) {
            log.info("Brevo sending disabled; skipping email for {}", recipientEmail);
            return;
        }
        if (brevoProperties.getApiKey() == null || brevoProperties.getApiKey().isBlank()
                || brevoProperties.getFromEmail() == null || brevoProperties.getFromEmail().isBlank()) {
            log.warn("Brevo API key or sender email not configured; skipping email for {}", recipientEmail);
            return;
        }
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Recipient email missing; skipping email");
            return;
        }

        String resolvedSubject = resolveSubject(subject);
        String resolvedBody = htmlContent == null ? "" : htmlContent;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoProperties.getApiKey());

        String fromName = brevoProperties.getFromName();
        if (fromName == null || fromName.isBlank()) {
            fromName = "FundBridge";
        }

        Map<String, Object> payload = Map.of(
                "sender", Map.of(
                        "email", brevoProperties.getFromEmail(),
                        "name", fromName
                ),
                "to", List.of(Map.of("email", recipientEmail)),
                "subject", resolvedSubject,
                "htmlContent", resolvedBody
        );

        restTemplate.postForEntity(brevoProperties.getBaseUrl() + "/v3/smtp/email",
                new HttpEntity<>(payload, headers), Void.class);
    }

    private String resolveSubject(String subject) {
        if (subject != null && !subject.isBlank()) {
            return subject.trim();
        }
        String fallback = brevoProperties.getDefaultSubject();
        if (fallback == null || fallback.isBlank()) {
            return "FundBridge notification";
        }
        return fallback.trim();
    }
}
