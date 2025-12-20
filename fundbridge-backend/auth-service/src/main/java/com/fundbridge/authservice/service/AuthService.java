package com.fundbridge.authservice.service;

import com.fundbridge.authservice.dto.AuthResponse;
import com.fundbridge.authservice.dto.LoginRequest;
import com.fundbridge.authservice.dto.RefreshTokenRequest;
import com.fundbridge.authservice.dto.RegisterInitRequest;
import com.fundbridge.authservice.dto.RegisterRequest;
import com.fundbridge.authservice.dto.TokenResult;
import com.fundbridge.authservice.dto.UserResponse;
import com.fundbridge.authservice.entity.UserAccount;
import com.fundbridge.authservice.entity.UserRole;
import com.fundbridge.authservice.entity.UserSettings;
import com.fundbridge.authservice.entity.UserStatus;
import com.fundbridge.authservice.exception.ResourceConflictException;
import com.fundbridge.authservice.kyc.KycApplicationService;
import com.fundbridge.authservice.kyc.dto.CreateApplicantRequest;
import com.fundbridge.authservice.kyc.dto.KycApplicantResponse;
import com.fundbridge.authservice.mapper.UserMapper;
import com.fundbridge.authservice.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
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
    private final RecaptchaService recaptchaService;
    private final KycApplicationService kycApplicationService;
    private final RoleService roleService;
    private final TokenService tokenService;
    private final OtpService otpService;
    private final LoginAuditService loginAuditService;

    public AuthService(UserService userService,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       RecaptchaService recaptchaService,
                       KycApplicationService kycApplicationService,
                       RoleService roleService,
                       TokenService tokenService,
                       OtpService otpService,
                       LoginAuditService loginAuditService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.recaptchaService = recaptchaService;
        this.kycApplicationService = kycApplicationService;
        this.roleService = roleService;
        this.tokenService = tokenService;
        this.otpService = otpService;
        this.loginAuditService = loginAuditService;
    }

    @Transactional
    public void startRegistration(RegisterInitRequest request) {
        recaptchaService.verify(request.captchaToken());
        String normalizedEmail = normalizeEmail(request.email());
        if (userService.existsByEmail(normalizedEmail)) {
            throw new ResourceConflictException("Email already registered");
        }
        otpService.sendEmailVerificationOtp(normalizedEmail);
    }

    @Transactional
    public AuthResponse completeRegistration(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (userService.existsByEmail(normalizedEmail)) {
            throw new ResourceConflictException("Email already registered");
        }
        otpService.verifyEmailOtp(normalizedEmail, request.otp());

        UserAccount userAccount = new UserAccount();
        userAccount.setName(request.name().trim());
        userAccount.setEmail(normalizedEmail);
        userAccount.setPasswordHash(passwordEncoder.encode(request.password()));
        userAccount.setEmailVerified(true);
        userAccount.setStatus(UserStatus.ACTIVE);
        UserRole requestedRole = request.role();
        if (requestedRole == null || requestedRole == UserRole.ADMIN) {
            requestedRole = UserRole.BORROWER;
        }
        userAccount.assignRole(roleService.getRole(requestedRole));
        userAccount.setSettings(new UserSettings());

        UserAccount saved = userService.save(userAccount);
        startKycVerification(saved);
        UserPrincipal principal = UserPrincipal.from(saved);
        TokenResult tokens = tokenService.issueTokens(principal.getUser());
        return new AuthResponse(tokens.tokens().accessToken(), tokens.tokens().refreshToken(), UserMapper.toResponse(saved));
    }

    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        recaptchaService.verify(request.captchaToken());
        String normalizedEmail = normalizeEmail(request.email());
        var authenticationToken = new UsernamePasswordAuthenticationToken(
                normalizedEmail, request.password()
        );
        String clientIp = resolveClientIp(httpRequest);
        String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : null;
        try {
            var authentication = authenticationManager.authenticate(authenticationToken);
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            UserAccount user = principal.getUser();
            if (!user.isEmailVerified()) {
                loginAuditService.record(user, normalizedEmail, false, "EMAIL_NOT_VERIFIED", clientIp, userAgent);
                throw new ResourceConflictException("Email not verified. Please verify before logging in.");
            }
            if (user.getStatus() != UserStatus.ACTIVE) {
                loginAuditService.record(user, normalizedEmail, false, "USER_" + user.getStatus(), clientIp, userAgent);
                throw new ResourceConflictException("Account is not active.");
            }
            TokenResult tokens = tokenService.issueTokens(user);
            loginAuditService.record(user, normalizedEmail, true, null, clientIp, userAgent);
            return new AuthResponse(tokens.tokens().accessToken(), tokens.tokens().refreshToken(), UserMapper.toResponse(user));
        } catch (Exception exception) {
            loginAuditService.record(null, normalizedEmail, false, exception.getMessage(), clientIp, userAgent);
            throw exception;
        }
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        TokenResult tokens = tokenService.refresh(request.refreshToken());
        return new AuthResponse(tokens.tokens().accessToken(), tokens.tokens().refreshToken(), UserMapper.toResponse(tokens.user()));
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

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.US);
    }

    private String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
