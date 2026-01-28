package com.fundbridge.adminservice.dto;

import java.util.List;

public record ServiceHealthResponse(
        String serviceId,
        String status,
        int instanceCount,
        int upInstances,
        int downInstances,
        List<ServiceInstanceHealthResponse> instances
) {
}
