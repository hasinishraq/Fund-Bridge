package com.fundbridge.authservice.controller;

import com.fundbridge.authservice.dto.AuthResponse;
import com.fundbridge.authservice.dto.ForgotPasswordRequest;
import com.fundbridge.authservice.dto.LoginRequest;
import com.fundbridge.authservice.dto.PasswordResetRequest;
import com.fundbridge.authservice.dto.RefreshTokenRequest;
import com.fundbridge.authservice.dto.RegisterInitRequest;
import com.fundbridge.authservice.dto.RegisterRequest;
import com.fundbridge.authservice.dto.UserResponse;
import com.fundbridge.authservice.security.UserPrincipal;
import com.fundbridge.authservice.service.AuthService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * External callers must reach these endpoints through the API Gateway at /api/auth/**;
 * hitting /auth/** directly is reserved for trusted server-to-server communication.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/init")
    public ResponseEntity<Void> startRegistration(@Valid @RequestBody RegisterInitRequest request) {
        authService.startRegistration(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/register/complete")
    public ResponseEntity<AuthResponse> completeRegistration(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.completeRegistration(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    @PostMapping("/token/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @PostMapping("/password/forgot")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.startPasswordReset(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/password/reset")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> profile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(authService.currentUser(principal));
    }
}
