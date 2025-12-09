package com.fundbridge.kycservice.exception;

public class KycProviderException extends RuntimeException {
    public KycProviderException(String message) {
        super(message);
    }

    public KycProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}
