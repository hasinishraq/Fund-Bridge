package com.fundbridge.authservice.service;

import com.fundbridge.authservice.entity.OtpCode;
import com.fundbridge.authservice.entity.OtpPurpose;
import com.fundbridge.authservice.exception.InvalidOtpException;
import com.fundbridge.authservice.repository.OtpCodeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;

@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final int OTP_LENGTH = 6;
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration OTP_TTL = Duration.ofMinutes(10);

    private final OtpCodeRepository otpCodeRepository;
    private final HashService hashService;
    private final BrevoEmailService brevoEmailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(OtpCodeRepository otpCodeRepository,
                      HashService hashService,
                      BrevoEmailService brevoEmailService) {
        this.otpCodeRepository = otpCodeRepository;
        this.hashService = hashService;
        this.brevoEmailService = brevoEmailService;
    }

    @Transactional
    public void sendEmailVerificationOtp(String email) {
        String sanitizedEmail = email == null ? null : email.trim().toLowerCase();
        if (sanitizedEmail == null || sanitizedEmail.isBlank()) {
            throw new IllegalArgumentException("Email is required for OTP");
        }
        String otp = generateOtp();
        OtpCode code = new OtpCode();
        code.setEmail(sanitizedEmail);
        code.setPurpose(OtpPurpose.EMAIL_VERIFY);
        code.setOtpHash(hashService.sha256(otp));
        code.setExpiresAt(Instant.now().plus(OTP_TTL));
        otpCodeRepository.save(code);
        brevoEmailService.sendOtpEmail(sanitizedEmail, otp, OTP_TTL.toMinutes());
        log.info("Dispatched email verification OTP for {}", sanitizedEmail);
    }

    @Transactional
    public void verifyEmailOtp(String email, String otp) {
        String sanitizedEmail = email == null ? null : email.trim().toLowerCase();
        if (sanitizedEmail == null || sanitizedEmail.isBlank()) {
            throw new InvalidOtpException("Email is required");
        }
        OtpCode code = otpCodeRepository.findTopByEmailIgnoreCaseAndPurposeOrderByIdDesc(
                        sanitizedEmail, OtpPurpose.EMAIL_VERIFY)
                .orElseThrow(() -> new InvalidOtpException("No OTP found for this email"));

        if (code.isUsed()) {
            throw new InvalidOtpException("OTP already used");
        }
        if (code.isExpired()) {
            throw new InvalidOtpException("OTP expired");
        }
        if (code.getAttempts() >= MAX_ATTEMPTS) {
            throw new InvalidOtpException("Too many invalid attempts");
        }

        String submittedHash = hashService.sha256(otp);
        if (!submittedHash.equalsIgnoreCase(code.getOtpHash())) {
            code.setAttempts(code.getAttempts() + 1);
            otpCodeRepository.save(code);
            throw new InvalidOtpException("Invalid OTP code");
        }

        code.setUsedAt(Instant.now());
        otpCodeRepository.save(code);
    }

    private String generateOtp() {
        int max = (int) Math.pow(10, OTP_LENGTH);
        int number = secureRandom.nextInt(max);
        return String.format("%0" + OTP_LENGTH + "d", number);
    }
}
