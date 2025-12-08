package com.fundbridge.walletservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.NestedConfigurationProperty;

@ConfigurationProperties(prefix = "storage")
public class StorageProperties {

    private String provider;
    private String endpoint;
    private String bucket;
    private String basePath;

    @NestedConfigurationProperty
    private final Credentials credentials = new Credentials();

    @NestedConfigurationProperty
    private final Paths paths = new Paths();

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public String getBasePath() {
        return basePath;
    }

    public void setBasePath(String basePath) {
        this.basePath = basePath;
    }

    public Credentials getCredentials() {
        return credentials;
    }

    public Paths getPaths() {
        return paths;
    }

    public static class Credentials {
        private String accessKey;
        private String secretKey;

        public String getAccessKey() {
            return accessKey;
        }

        public void setAccessKey(String accessKey) {
            this.accessKey = accessKey;
        }

        public String getSecretKey() {
            return secretKey;
        }

        public void setSecretKey(String secretKey) {
            this.secretKey = secretKey;
        }
    }

    public static class Paths {
        private String statements;
        private String receipts;

        public String getStatements() {
            return statements;
        }

        public void setStatements(String statements) {
            this.statements = statements;
        }

        public String getReceipts() {
            return receipts;
        }

        public void setReceipts(String receipts) {
            this.receipts = receipts;
        }
    }
}
