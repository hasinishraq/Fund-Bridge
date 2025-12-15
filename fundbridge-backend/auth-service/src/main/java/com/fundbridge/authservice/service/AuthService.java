package com.fundbridge.authservice.service;

import com.fundbridge.authservice.dto.AuthResponse;
import com.fundbridge.authservice.dto.LoginRequest;
import com.fundbridge.authservice.dto.RegisterRequest;
import com.fundbridge.authservice.dto.UserResponse;
import com.fundbridge.authservice.entity.UserAccount;
import com.fundbridge.authservice.entity.UserRole;
import com.fundbridge.authservice.entity.UserSettings;
import com.fundbridge.authservice.exception.ResourceConflictException;
import com.fundbridge.authservice.kyc.KycApplicationService;
import com.fundbridge.authservice.kyc.dto.CreateApplicantRequest;
import com.fundbridge.authservice.kyc.dto.KycApplicantResponse;
import com.fundbridge.authservice.mapper.UserMapper;
import com.fundbridge.authservice.security.JwtService;
import com.fundbridge.authservice.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RecaptchaService recaptchaService;
    private final KycApplicationService kycApplicationService;

    public AuthService(UserService userService,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       RecaptchaService recaptchaService,
                       KycApplicationService kycApplicationService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.recaptchaService = recaptchaService;
        this.kycApplicationService = kycApplicationService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.US);
        if (userService.existsByEmail(normalizedEmail)) {
            throw new ResourceConflictException("Email already registered");
        }

        UserAccount userAccount = new UserAccount();
        userAccount.setName(request.name().trim());
        userAccount.setEmail(normalizedEmail);
        userAccount.setPassword(passwordEncoder.encode(request.password()));
        userAccount.setRole(UserRole.BORROWER);
        userAccount.setSettings(new UserSettings());

        UserAccount saved = userService.save(userAccount);
        startKycVerification(saved);
        UserPrincipal principal = UserPrincipal.from(saved);
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, UserMapper.toResponse(saved));
    }

    public AuthResponse login(LoginRequest request) {
        recaptchaService.verify(request.captchaToken());
        String normalizedEmail = request.email().trim().toLowerCase(Locale.US);
        var authenticationToken = new UsernamePasswordAuthenticationToken(
                normalizedEmail, request.password()
        );
        var authentication = authenticationManager.authenticate(authenticationToken);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, UserMapper.toResponse(principal.getUser()));
    }

    public UserResponse currentUser(UserPrincipal principal) {
        if (principal == null) {
            throw new IllegalStateException("No authenticated user in context");
        }
        return UserMapper.toResponse(principal.getUser());
    }

    private void startKycVerification(UserAccount userAccount) {
        try {
            KycApplicantResponse applicantResponse = kycApplicationService.createApplicant(
                    new CreateApplicantRequest(userAccount.getId(), userAccount.getName(), userAccount.getEmail())
            );
            if (applicantResponse == null || applicantResponse.applicantId() == null) {
                log.warn("KYC integration returned an invalid response for user {}", userAccount.getEmail());
                return;
            }
            userAccount.setKycApplicantId(applicantResponse.applicantId());
            if (applicantResponse.status() != null) {
                userAccount.setKycStatus(applicantResponse.status());
            }
            userAccount.setKycReviewUrl(applicantResponse.reviewUrl());
            userAccount.setKycLastSyncedAt(Instant.now());
        } catch (Exception exception) {
            log.error("Unable to start KYC verification for user {}. Proceeding with pending status.",
                    userAccount.getEmail(), exception);
        }
    }
}
