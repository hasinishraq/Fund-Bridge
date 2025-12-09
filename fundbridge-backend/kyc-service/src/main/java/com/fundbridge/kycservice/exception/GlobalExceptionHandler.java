package com.fundbridge.kycservice.exception;

import com.fundbridge.kycservice.dto.ApiError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception) {
        return ResponseEntity.badRequest()
                .body(new ApiError("Validation failed", HttpStatus.BAD_REQUEST.value()));
    }

    @ExceptionHandler(KycProviderException.class)
    public ResponseEntity<ApiError> handleProvider(KycProviderException exception) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ApiError(exception.getMessage(), HttpStatus.SERVICE_UNAVAILABLE.value()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception exception) {
        log.error("Unexpected error in kyc-service", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("Unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR.value()));
    }
}
