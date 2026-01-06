package com.fundbridge.notificationservice.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class NotificationTemplateRenderer {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("\\{\\{\\s*([\\w.]+)\\s*}}",
            Pattern.CASE_INSENSITIVE);

    public String render(String template, Map<String, Object> payload) {
        if (template == null) {
            return null;
        }
        Matcher matcher = TOKEN_PATTERN.matcher(template);
        StringBuffer buffer = new StringBuffer();
        while (matcher.find()) {
            String key = matcher.group(1);
            Object value = resolveValue(payload, key);
            String replacement = value == null ? matcher.group(0) : Matcher.quoteReplacement(String.valueOf(value));
            matcher.appendReplacement(buffer, replacement);
        }
        matcher.appendTail(buffer);
        return buffer.toString();
    }

    private Object resolveValue(Map<String, Object> payload, String key) {
        if (payload == null || payload.isEmpty() || key == null) {
            return null;
        }
        Object current = payload;
        String[] parts = key.split("\\.");
        for (String part : parts) {
            if (!(current instanceof Map<?, ?>)) {
                return null;
            }
            current = ((Map<?, ?>) current).get(part);
            if (current == null) {
                return null;
            }
        }
        return current;
    }
}
