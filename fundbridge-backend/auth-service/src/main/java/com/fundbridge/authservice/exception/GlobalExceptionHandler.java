package com.fundbridge.authservice.exception;

import com.fundbridge.authservice.dto.ApiError;
import com.fundbridge.authservice.dto.ValidationError;
import com.fundbridge.authservice.kyc.exception.KycProviderException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceConflictException.class)
    public ResponseEntity<ApiError> handleConflict(ResourceConflictException exception,
                                                   HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiError.of(exception.getMessage(), HttpStatus.CONFLICT, request.getRequestURI()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException exception,
                                                         HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiError.of("Invalid credentials", HttpStatus.UNAUTHORIZED, request.getRequestURI()));
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiError> handleLocked(LockedException exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.LOCKED)
                .body(ApiError.of("Account is locked", HttpStatus.LOCKED, request.getRequestURI()));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiError> handleDisabled(DisabledException exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiError.of("Account is disabled", HttpStatus.FORBIDDEN, request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception,
                                                     HttpServletRequest request) {
        List<ValidationError> errors = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fieldError -> new ValidationError(fieldError.getField(), fieldError.getDefaultMessage()))
                .toList();
        return ResponseEntity.badRequest()
                .body(ApiError.withErrors("Validation failed", HttpStatus.BAD_REQUEST, request.getRequestURI(), errors));
    }

    @ExceptionHandler(InvalidCaptchaException.class)
    public ResponseEntity<ApiError> handleCaptcha(InvalidCaptchaException exception, HttpServletRequest request) {
        List<ValidationError> errors = List.of(new ValidationError("captchaToken", exception.getMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiError.withErrors(exception.getMessage(), HttpStatus.BAD_REQUEST, request.getRequestURI(), errors));
    }

    @ExceptionHandler(KycIntegrationException.class)
    public ResponseEntity<ApiError> handleKyc(KycIntegrationException exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiError.of(exception.getMessage(), HttpStatus.SERVICE_UNAVAILABLE, request.getRequestURI()));
    }

    @ExceptionHandler(KycProviderException.class)
    public ResponseEntity<ApiError> handleKycProvider(KycProviderException exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiError.of(exception.getMessage(), HttpStatus.SERVICE_UNAVAILABLE, request.getRequestURI()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(exception.getMessage(), HttpStatus.NOT_FOUND, request.getRequestURI()));
    }

    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<ApiError> handleOtp(InvalidOtpException exception, HttpServletRequest request) {
        List<ValidationError> errors = List.of(new ValidationError("otp", exception.getMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiError.withErrors(exception.getMessage(), HttpStatus.BAD_REQUEST, request.getRequestURI(), errors));
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<ApiError> handleInvalidToken(InvalidTokenException exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiError.of(exception.getMessage(), HttpStatus.UNAUTHORIZED, request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception exception, HttpServletRequest request) {
        log.error("Unexpected error processing {}", request.getRequestURI(), exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiError.of("Unexpected error occurred", HttpStatus.INTERNAL_SERVER_ERROR, request.getRequestURI()));
    }
}
