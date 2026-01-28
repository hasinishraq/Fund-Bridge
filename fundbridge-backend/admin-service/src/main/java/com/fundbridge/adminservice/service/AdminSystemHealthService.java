package com.fundbridge.adminservice.service;

import com.fundbridge.adminservice.config.SystemHealthProperties;
import com.fundbridge.adminservice.dto.ServiceHealthResponse;
import com.fundbridge.adminservice.dto.ServiceInstanceHealthResponse;
import com.fundbridge.adminservice.dto.SystemHealthResponse;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class AdminSystemHealthService {

    private final DiscoveryClient discoveryClient;
    private final SystemHealthProperties properties;
    private final RestTemplate restTemplate;

    public AdminSystemHealthService(DiscoveryClient discoveryClient,
                                    SystemHealthProperties properties,
                                    RestTemplateBuilder restTemplateBuilder) {
        this.discoveryClient = discoveryClient;
        this.properties = properties;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(properties.getTimeout())
                .setReadTimeout(properties.getTimeout())
                .build();
    }

    public SystemHealthResponse getSystemHealth() {
        Map<String, List<ServiceTarget>> targets = resolveTargets();
        List<ServiceHealthResponse> services = new ArrayList<>();

        for (Map.Entry<String, List<ServiceTarget>> entry : targets.entrySet()) {
            services.add(buildServiceHealth(entry.getKey(), entry.getValue()));
        }

        services.sort(Comparator.comparing(ServiceHealthResponse::serviceId));

        int total = services.size();
        int up = (int) services.stream().filter(service -> "UP".equals(service.status())).count();
        int down = (int) services.stream().filter(service -> "DOWN".equals(service.status())).count();
        int degraded = total - up - down;

        String status;
        if (total == 0) {
            status = "UNKNOWN";
        } else if (down == 0 && degraded == 0) {
            status = "UP";
        } else if (up == 0) {
            status = "DOWN";
        } else {
            status = "DEGRADED";
        }

        return new SystemHealthResponse(
                status,
                total,
                up,
                degraded,
                down,
                services,
                Instant.now()
        );
    }

    private Map<String, List<ServiceTarget>> resolveTargets() {
        Map<String, Map<String, ServiceTarget>> aggregated = new LinkedHashMap<>();

        if (properties.isIncludeDiscovery()) {
            try {
                for (String serviceId : discoveryClient.getServices()) {
                    List<ServiceInstance> instances = discoveryClient.getInstances(serviceId);
                    for (ServiceInstance instance : instances) {
                        String baseUrl = instance.getUri().toString();
                        String instanceId = instance.getInstanceId();
                        if (instanceId == null || instanceId.isBlank()) {
                            instanceId = instance.getHost() + ":" + instance.getPort();
                        }
                        ServiceTarget target = new ServiceTarget(
                                serviceId,
                                instanceId,
                                baseUrl,
                                resolveHealthUrl(baseUrl, properties.getHealthPath()),
                                instance.getHost(),
                                instance.getPort()
                        );
                        registerTarget(aggregated, target);
                    }
                }
            } catch (Exception ignored) {
            }
        }

        for (SystemHealthProperties.StaticService staticService : properties.getStaticServices()) {
            if (staticService.getBaseUrl() == null || staticService.getBaseUrl().isBlank()) {
                continue;
            }
            try {
                String serviceId = staticService.getName() != null ? staticService.getName() : "static-service";
                String baseUrl = staticService.getBaseUrl();
                String healthPath = staticService.getHealthPath() != null
                        ? staticService.getHealthPath()
                        : properties.getHealthPath();
                URI uri = URI.create(baseUrl);
                ServiceTarget target = new ServiceTarget(
                        serviceId,
                        serviceId + "-static",
                        baseUrl,
                        resolveHealthUrl(baseUrl, healthPath),
                        uri.getHost(),
                        resolvePort(uri)
                );
                registerTarget(aggregated, target);
            } catch (Exception ignored) {
            }
        }

        Map<String, List<ServiceTarget>> resolved = new HashMap<>();
        for (Map.Entry<String, Map<String, ServiceTarget>> entry : aggregated.entrySet()) {
            resolved.put(entry.getKey(), new ArrayList<>(entry.getValue().values()));
        }
        return resolved;
    }

    private void registerTarget(Map<String, Map<String, ServiceTarget>> aggregated, ServiceTarget target) {
        aggregated
                .computeIfAbsent(target.serviceId(), key -> new LinkedHashMap<>())
                .putIfAbsent(target.baseUrl(), target);
    }

    private ServiceHealthResponse buildServiceHealth(String serviceId, List<ServiceTarget> targets) {
        List<ServiceInstanceHealthResponse> instances = new ArrayList<>();
        int upCount = 0;

        for (ServiceTarget target : targets) {
            ServiceInstanceHealthResponse response = checkHealth(target);
            instances.add(response);
            if ("UP".equals(response.status())) {
                upCount++;
            }
        }

        int totalInstances = instances.size();
        int downCount = totalInstances - upCount;
        String status;
        if (totalInstances == 0) {
            status = "UNKNOWN";
        } else if (downCount == 0) {
            status = "UP";
        } else if (upCount == 0) {
            status = "DOWN";
        } else {
            status = "DEGRADED";
        }

        return new ServiceHealthResponse(
                serviceId,
                status,
                totalInstances,
                upCount,
                downCount,
                instances
        );
    }

    private ServiceInstanceHealthResponse checkHealth(ServiceTarget target) {
        long start = System.nanoTime();
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(target.healthUrl(), Map.class);
            long latencyMs = toMillis(start);
            String status = extractStatus(response.getBody());
            if (!response.getStatusCode().is2xxSuccessful() && "UNKNOWN".equals(status)) {
                status = "DOWN";
            }
            return new ServiceInstanceHealthResponse(
                    target.instanceId(),
                    target.host(),
                    target.port(),
                    target.baseUrl(),
                    status,
                    latencyMs,
                    null
            );
        } catch (RestClientException ex) {
            long latencyMs = toMillis(start);
            return new ServiceInstanceHealthResponse(
                    target.instanceId(),
                    target.host(),
                    target.port(),
                    target.baseUrl(),
                    "DOWN",
                    latencyMs,
                    simplifyError(ex)
            );
        }
    }

    private long toMillis(long startNanos) {
        return Math.max(0L, (System.nanoTime() - startNanos) / 1_000_000L);
    }

    private String extractStatus(Map body) {
        if (body == null) {
            return "UNKNOWN";
        }
        Object status = body.get("status");
        return status != null ? status.toString() : "UNKNOWN";
    }

    private String simplifyError(Exception ex) {
        String message = ex.getMessage();
        if (message == null || message.isBlank()) {
            return ex.getClass().getSimpleName();
        }
        return ex.getClass().getSimpleName() + ": " + message;
    }

    private String resolveHealthUrl(String baseUrl, String healthPath) {
        String path = healthPath != null ? healthPath : properties.getHealthPath();
        return UriComponentsBuilder.fromHttpUrl(baseUrl)
                .path(normalizePath(path))
                .build()
                .toUriString();
    }

    private String normalizePath(String path) {
        if (path == null || path.isBlank()) {
            return properties.getHealthPath();
        }
        if (!path.startsWith("/")) {
            return "/" + path;
        }
        return path;
    }

    private int resolvePort(URI uri) {
        if (uri.getPort() > 0) {
            return uri.getPort();
        }
        if (Objects.equals(uri.getScheme(), "https")) {
            return 443;
        }
        return 80;
    }

    private record ServiceTarget(
            String serviceId,
            String instanceId,
            String baseUrl,
            String healthUrl,
            String host,
            int port
    ) {
    }
}
