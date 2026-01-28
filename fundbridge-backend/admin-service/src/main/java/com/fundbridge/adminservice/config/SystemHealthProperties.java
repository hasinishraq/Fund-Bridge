package com.fundbridge.adminservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Component
@ConfigurationProperties(prefix = "admin.system-health")
public class SystemHealthProperties {

    private Duration timeout = Duration.ofSeconds(2);
    private String healthPath = "/actuator/health";
    private boolean includeDiscovery = true;
    private List<StaticService> staticServices = new ArrayList<>();

    public Duration getTimeout() {
        return timeout;
    }

    public void setTimeout(Duration timeout) {
        this.timeout = timeout;
    }

    public String getHealthPath() {
        return healthPath;
    }

    public void setHealthPath(String healthPath) {
        this.healthPath = healthPath;
    }

    public boolean isIncludeDiscovery() {
        return includeDiscovery;
    }

    public void setIncludeDiscovery(boolean includeDiscovery) {
        this.includeDiscovery = includeDiscovery;
    }

    public List<StaticService> getStaticServices() {
        return staticServices;
    }

    public void setStaticServices(List<StaticService> staticServices) {
        this.staticServices = staticServices;
    }

    public static class StaticService {
        private String name;
        private String baseUrl;
        private String healthPath;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getHealthPath() {
            return healthPath;
        }

        public void setHealthPath(String healthPath) {
            this.healthPath = healthPath;
        }
    }
}
