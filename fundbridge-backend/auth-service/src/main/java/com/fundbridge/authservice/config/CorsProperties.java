package com.fundbridge.authservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.CollectionUtils;

import java.util.List;

@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(
        List<String> allowedOrigins,
        List<String> allowedOriginPatterns,
        List<String> allowedMethods,
        List<String> allowedHeaders,
        List<String> exposedHeaders,
        boolean allowCredentials
) {

    public CorsProperties {
        allowedOrigins = resolveOrDefault(allowedOrigins, List.of("http://localhost:5173"));
        allowedOriginPatterns = resolveOrDefault(allowedOriginPatterns, List.of("http://localhost:*", "http://127.0.0.1:*"));
        allowedMethods = resolveOrDefault(allowedMethods, List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        allowedHeaders = resolveOrDefault(allowedHeaders, List.of("Authorization", "Content-Type"));
        exposedHeaders = resolveOrDefault(exposedHeaders, List.of("Authorization"));
    }

    private static List<String> resolveOrDefault(List<String> value, List<String> defaults) {
        return CollectionUtils.isEmpty(value) ? defaults : List.copyOf(value);
    }
}
