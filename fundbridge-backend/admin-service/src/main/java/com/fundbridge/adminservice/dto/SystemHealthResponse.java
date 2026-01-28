package com.fundbridge.adminservice.dto;

import java.time.Instant;
import java.util.List;

public record SystemHealthResponse(
        String status,
        int totalServices,
        int upServices,
        int degradedServices,
        int downServices,
        List<ServiceHealthResponse> services,
        Instant generatedAt
) {
}
