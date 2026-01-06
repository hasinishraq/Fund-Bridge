package com.fundbridge.notificationservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "notification.outbox")
public class NotificationOutboxProperties {

    private long pollIntervalMs = 5000;
    private int batchSize = 50;
    private int maxAttempts = 3;
    private long retryDelayMs = 30000;

    public long getPollIntervalMs() {
        return pollIntervalMs;
    }

    public void setPollIntervalMs(long pollIntervalMs) {
        this.pollIntervalMs = pollIntervalMs;
    }

    public int getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(int batchSize) {
        this.batchSize = batchSize;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public long getRetryDelayMs() {
        return retryDelayMs;
    }

    public void setRetryDelayMs(long retryDelayMs) {
        this.retryDelayMs = retryDelayMs;
    }
}
