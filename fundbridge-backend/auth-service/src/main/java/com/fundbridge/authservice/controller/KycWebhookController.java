package com.fundbridge.authservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fundbridge.authservice.entity.KycStatus;
import com.fundbridge.authservice.entity.UserAccount;
import com.fundbridge.authservice.kyc.KycApplicationService;
import com.fundbridge.authservice.kyc.config.SumsubProperties;
import com.fundbridge.authservice.kyc.sumsub.dto.SumsubWebhookPayload;
import com.fundbridge.authservice.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

@RestController
@RequestMapping("/kyc/webhook")
public class KycWebhookController {

    private static final Logger log = LoggerFactory.getLogger(KycWebhookController.class);
    private static final String EXTERNAL_USER_PREFIX = "fundbridge-user-";

    private final ObjectMapper objectMapper;
    private final SumsubProperties properties;
    private final UserService userService;
    private final KycApplicationService kycApplicationService;

    public KycWebhookController(ObjectMapper objectMapper,
                                SumsubProperties properties,
                                UserService userService,
                                KycApplicationService kycApplicationService) {
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.userService = userService;
        this.kycApplicationService = kycApplicationService;
    }

    @PostMapping
    public ResponseEntity<String> handleWebhook(@RequestHeader HttpHeaders headers,
                                                @RequestBody byte[] rawBody) {
        if (!verifySignature(headers, rawBody)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
        }
        SumsubWebhookPayload payload = parsePayload(rawBody);
        if (payload == null) {
            return ResponseEntity.ok("ignored");
        }
        if (!StringUtils.hasText(payload.reviewStatus())) {
            return ResponseEntity.ok("ignored");
        }
        Optional<UserAccount> userOptional = resolveUser(payload.externalUserId(), payload.applicantId());
        if (userOptional.isEmpty()) {
            log.warn("KYC webhook received for unknown applicant {} externalUserId {}",
                    payload.applicantId(), payload.externalUserId());
            return ResponseEntity.ok("ignored");
        }
        KycStatus status = kycApplicationService.mapStatus(
                payload.reviewStatus(),
                payload.reviewResult() != null ? payload.reviewResult().reviewAnswer() : null,
                payload.reviewResult() != null ? payload.reviewResult().reviewRejectType() : null
        );
        UserAccount user = userOptional.get();
        if (StringUtils.hasText(payload.applicantId())) {
            user.setKycApplicantId(payload.applicantId());
        }
        user.setKycStatus(status);
        user.setKycLastSyncedAt(Instant.now());
        userService.save(user);
        return ResponseEntity.ok("ok");
    }

    private SumsubWebhookPayload parsePayload(byte[] rawBody) {
        try {
            return objectMapper.readValue(rawBody, SumsubWebhookPayload.class);
        } catch (Exception exception) {
            log.warn("Unable to parse Sumsub webhook payload", exception);
            return null;
        }
    }

    private Optional<UserAccount> resolveUser(String externalUserId, String applicantId) {
        Optional<UserAccount> byExternal = resolveByExternalUserId(externalUserId);
        if (byExternal.isPresent()) {
            return byExternal;
        }
        if (StringUtils.hasText(applicantId)) {
            return userService.findByKycApplicantId(applicantId);
        }
        return Optional.empty();
    }

    private Optional<UserAccount> resolveByExternalUserId(String externalUserId) {
        if (!StringUtils.hasText(externalUserId) || !externalUserId.startsWith(EXTERNAL_USER_PREFIX)) {
            return Optional.empty();
        }
        String rawId = externalUserId.substring(EXTERNAL_USER_PREFIX.length());
        try {
            Long userId = Long.parseLong(rawId);
            return userService.findById(userId);
        } catch (NumberFormatException exception) {
            return Optional.empty();
        }
    }

    private boolean verifySignature(HttpHeaders headers, byte[] rawBody) {
        String secret = properties.getWebhookSecret();
        if (!StringUtils.hasText(secret)) {
            log.warn("Sumsub webhook secret not configured; skipping signature validation");
            return true;
        }
        String digest = headers.getFirst("x-payload-digest");
        String alg = headers.getFirst("x-payload-digest-alg");
        if (!StringUtils.hasText(digest)) {
            log.warn("Sumsub webhook missing digest header");
            return false;
        }
        String macAlg = resolveMacAlgorithm(alg);
        String computed = computeHmac(rawBody, secret, macAlg);
        return MessageDigest.isEqual(
                computed.getBytes(StandardCharsets.UTF_8),
                digest.toLowerCase(Locale.US).getBytes(StandardCharsets.UTF_8)
        );
    }

    private String resolveMacAlgorithm(String algHeader) {
        if (!StringUtils.hasText(algHeader)) {
            return "HmacSHA256";
        }
        return switch (algHeader.toUpperCase(Locale.US)) {
            case "HMAC_SHA512_HEX" -> "HmacSHA512";
            case "HMAC_SHA1_HEX" -> "HmacSHA1";
            default -> "HmacSHA256";
        };
    }

    private String computeHmac(byte[] payload, String secret, String macAlgorithm) {
        try {
            Mac mac = Mac.getInstance(macAlgorithm);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), macAlgorithm));
            byte[] digest = mac.doFinal(payload);
            return HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            log.error("Unable to verify Sumsub webhook signature", exception);
            return "";
        }
    }
}
