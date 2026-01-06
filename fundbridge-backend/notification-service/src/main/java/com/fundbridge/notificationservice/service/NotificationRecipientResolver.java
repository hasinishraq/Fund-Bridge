package com.fundbridge.notificationservice.service;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class NotificationRecipientResolver {

    public String resolveRecipientEmail(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return null;
        }
        String direct = firstNonBlank(payload,
                "email",
                "recipientEmail",
                "toEmail",
                "userEmail");
        if (direct != null) {
            return direct;
        }
        String nested = extractNestedEmail(payload.get("user"));
        if (nested != null) {
            return nested;
        }
        return extractNestedEmail(payload.get("recipient"));
    }

    private String firstNonBlank(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            String asString = toTrimmedString(value);
            if (asString != null) {
                return asString;
            }
        }
        return null;
    }

    private String extractNestedEmail(Object candidate) {
        if (!(candidate instanceof Map<?, ?>)) {
            return null;
        }
        Object value = ((Map<?, ?>) candidate).get("email");
        return toTrimmedString(value);
    }

    private String toTrimmedString(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isBlank() ? null : text;
    }
}
