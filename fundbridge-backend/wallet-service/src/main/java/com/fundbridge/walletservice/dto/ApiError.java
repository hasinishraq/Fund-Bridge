package com.fundbridge.walletservice.dto;

import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;

public record ApiError(
        String message,
        int status,
        Instant timestamp,
        String path,
        List<ValidationError> errors
) {

    public ApiError {
        errors = errors == null ? List.of() : List.copyOf(errors);
    }

    public static ApiError of(String message, HttpStatus status, String path) {
        return new ApiError(message, status.value(), Instant.now(), path, List.of());
    }

    public static ApiError withErrors(String message, HttpStatus status, String path, List<ValidationError> errors) {
        return new ApiError(message, status.value(), Instant.now(), path, errors);
    }
}
