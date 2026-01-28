package com.fundbridge.adminservice.dto;

public record ServiceInstanceHealthResponse(
        String instanceId,
        String host,
        int port,
        String baseUrl,
        String status,
        Long latencyMs,
        String error
) {
}
