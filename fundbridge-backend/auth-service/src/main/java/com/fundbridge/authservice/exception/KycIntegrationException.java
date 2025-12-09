package com.fundbridge.authservice.exception;

public class KycIntegrationException extends RuntimeException {
    public KycIntegrationException(String message) {
        super(message);
    }

    public KycIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
