package com.fundbridge.walletservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fundbridge.walletservice.config.StripeProperties;
import com.fundbridge.walletservice.dto.StripeConfirmRequest;
import com.fundbridge.walletservice.dto.StripePaymentIntentResponse;
import com.fundbridge.walletservice.dto.StripeTopUpRequest;
import com.fundbridge.walletservice.entity.PaymentIntentStatus;
import com.fundbridge.walletservice.entity.WalletAccount;
import com.fundbridge.walletservice.entity.WalletPaymentIntent;
import com.fundbridge.walletservice.entity.WalletTransaction;
import com.fundbridge.walletservice.exception.BadRequestException;
import com.fundbridge.walletservice.exception.ResourceConflictException;
import com.fundbridge.walletservice.repository.WalletPaymentIntentRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class StripePaymentService {

    private static final Logger log = LoggerFactory.getLogger(StripePaymentService.class);
    private static final int IDEMPOTENCY_MAX_LENGTH = 80;
    private static final BigDecimal MIN_STRIPE_BDT_AMOUNT = new BigDecimal("60.00"); // Stripe requires >= 50¢ equivalent

    private final StripeProperties stripeProperties;
    private final WalletService walletService;
    private final WalletPaymentIntentRepository paymentIntentRepository;
    private final ObjectMapper objectMapper;

    public StripePaymentService(StripeProperties stripeProperties,
                                WalletService walletService,
                                WalletPaymentIntentRepository paymentIntentRepository,
                                ObjectMapper objectMapper) {
        this.stripeProperties = stripeProperties;
        this.walletService = walletService;
        this.paymentIntentRepository = paymentIntentRepository;
        this.objectMapper = objectMapper;
        if (StringUtils.hasText(stripeProperties.getSecretKey())) {
            Stripe.apiKey = stripeProperties.getSecretKey();
        }
    }

    @Transactional
    public StripePaymentIntentResponse createTopUpIntent(StripeTopUpRequest request) {
        ensureStripeConfigured();
        if (!StringUtils.hasText(stripeProperties.getPublishableKey())) {
            throw new ResourceConflictException("Stripe publishable key is not configured");
        }
        Long userId = requireUserId(request.userId());
        BigDecimal normalizedAmount = normalizeAmount(request.amount());
        if (normalizedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than zero");
        }
        if (isBdt(request.currency()) && normalizedAmount.compareTo(MIN_STRIPE_BDT_AMOUNT) < 0) {
            throw new BadRequestException("Minimum Stripe card top up in BDT is " + MIN_STRIPE_BDT_AMOUNT.toPlainString());
        }

        String normalizedIdempotency = normalizeIdempotencyKey(request.idempotencyKey());
        WalletAccount account = walletService.ensureAccount(userId, request.currency());
        String currency = account.getCurrency();

        Optional<WalletPaymentIntent> existingIntentOpt = paymentIntentRepository.findByUserIdAndIdempotencyKeyForUpdate(userId, normalizedIdempotency);
        if (existingIntentOpt.isPresent()) {
            WalletPaymentIntent existingIntent = existingIntentOpt.get();
            PaymentIntent stripeIntent = retrievePaymentIntent(existingIntent.getPaymentIntentId());
            PaymentIntentStatus status = mapStatus(stripeIntent.getStatus());
            existingIntent.setStatus(status);
            existingIntent.setMetadataJson(serializeMetadata(stripeIntent));
            paymentIntentRepository.save(existingIntent);
            return new StripePaymentIntentResponse(
                    stripeIntent.getId(),
                    stripeIntent.getClientSecret(),
                    stripeProperties.getPublishableKey(),
                    existingIntent.getAmount(),
                    existingIntent.getCurrency(),
                    status,
                    existingIntent.getAccount().getId(),
                    existingIntent.getTransaction() != null ? existingIntent.getTransaction().getId() : null
            );
        }

        long amountMinor = toMinorUnits(normalizedAmount, currency);
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountMinor)
                .setCurrency(currency.toLowerCase())
                .setDescription("FundBridge wallet top up")
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder().setEnabled(true).build()
                )
                .putMetadata("userId", String.valueOf(userId))
                .putMetadata("walletAccountId", String.valueOf(account.getId()))
                .putMetadata("idempotencyKey", normalizedIdempotency)
                .putMetadata("referenceId", request.referenceId() != null ? request.referenceId() : "")
                .build();

        PaymentIntent paymentIntent;
        try {
            paymentIntent = PaymentIntent.create(params,
                    RequestOptions.builder()
                            .setIdempotencyKey(buildStripeIdempotencyKey(userId, normalizedIdempotency))
                            .build());
        } catch (StripeException e) {
            log.error("Failed to create Stripe payment intent for wallet top up", e);
            throw new BadRequestException("Unable to start card funding right now");
        }

        WalletPaymentIntent record = new WalletPaymentIntent();
        record.setPaymentIntentId(paymentIntent.getId());
        record.setStatus(mapStatus(paymentIntent.getStatus()));
        record.setAmount(normalizedAmount);
        record.setCurrency(currency);
        record.setUserId(userId);
        record.setAccount(account);
        record.setIdempotencyKey(normalizedIdempotency);
        record.setReferenceType("STRIPE");
        record.setReferenceId(request.referenceId() != null ? request.referenceId() : paymentIntent.getId());
        record.setMetadataJson(serializeMetadata(paymentIntent));
        paymentIntentRepository.save(record);

        return new StripePaymentIntentResponse(
                paymentIntent.getId(),
                paymentIntent.getClientSecret(),
                stripeProperties.getPublishableKey(),
                normalizedAmount,
                currency,
                record.getStatus(),
                account.getId(),
                null
        );
    }

    @Transactional
    public StripePaymentIntentResponse confirmTopUp(StripeConfirmRequest request) {
        ensureStripeConfigured();
        String paymentIntentId = requirePaymentIntentId(request.paymentIntentId());
        Long userId = requireUserId(request.userId());
        PaymentIntent paymentIntent = retrievePaymentIntent(paymentIntentId);

        Optional<WalletPaymentIntent> existingOpt = paymentIntentRepository.findByPaymentIntentIdForUpdate(paymentIntentId);
        if (existingOpt.isPresent()) {
            WalletPaymentIntent existing = existingOpt.get();
            if (existing.getUserId() != null && !existing.getUserId().equals(userId)) {
                throw new ResourceConflictException("Payment intent does not belong to the requesting user");
            }
        }
        Long metadataUserId = extractUserId(paymentIntent, existingOpt.map(WalletPaymentIntent::getUserId).orElse(null));
        if (metadataUserId == null) {
            throw new BadRequestException("Stripe payment intent is missing user metadata");
        }
        if (!metadataUserId.equals(userId)) {
            throw new ResourceConflictException("Payment intent does not belong to the requesting user");
        }

        handlePaymentIntentUpdate(paymentIntent);

        WalletPaymentIntent updated = paymentIntentRepository.findByPaymentIntentId(paymentIntentId).orElse(null);
        if (updated == null) {
            PaymentIntentStatus status = mapStatus(paymentIntent.getStatus());
            String currency = paymentIntent.getCurrency() != null ? paymentIntent.getCurrency().toUpperCase() : "BDT";
            BigDecimal amount = toMajorUnits(
                    paymentIntent.getAmountReceived() != null ? paymentIntent.getAmountReceived() : paymentIntent.getAmount(),
                    currency
            );
            return new StripePaymentIntentResponse(
                    paymentIntentId,
                    paymentIntent.getClientSecret(),
                    stripeProperties.getPublishableKey(),
                    amount,
                    currency,
                    status,
                    null,
                    null
            );
        }

        return new StripePaymentIntentResponse(
                updated.getPaymentIntentId(),
                paymentIntent.getClientSecret(),
                stripeProperties.getPublishableKey(),
                updated.getAmount(),
                updated.getCurrency(),
                updated.getStatus(),
                updated.getAccount() != null ? updated.getAccount().getId() : null,
                updated.getTransaction() != null ? updated.getTransaction().getId() : null
        );
    }

    @Transactional
    public void handleWebhook(String payload, String signatureHeader) {
        ensureStripeConfigured();
        if (!StringUtils.hasText(stripeProperties.getWebhookSecret())) {
            log.warn("Stripe webhook secret not configured; ignoring incoming webhook");
            throw new BadRequestException("Webhook secret not configured");
        }
        Event event;
        try {
            event = Webhook.constructEvent(payload, signatureHeader, stripeProperties.getWebhookSecret());
        } catch (SignatureVerificationException e) {
            log.warn("Invalid Stripe webhook signature: {}", e.getMessage());
            throw new BadRequestException("Invalid Stripe signature");
        }

        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        Optional<StripeObject> dataObject = deserializer.getObject();
        if (dataObject.isEmpty()) {
            log.warn("Unable to deserialize Stripe event payload for type {}", event.getType());
            return;
        }

        if (dataObject.get() instanceof PaymentIntent paymentIntent) {
            handlePaymentIntentUpdate(paymentIntent);
        } else {
            log.debug("Ignoring unsupported Stripe event type {}", event.getType());
        }
    }

    private void handlePaymentIntentUpdate(PaymentIntent paymentIntent) {
        String paymentIntentId = paymentIntent.getId();
        PaymentIntentStatus status = mapStatus(paymentIntent.getStatus());
        Optional<WalletPaymentIntent> existingOpt = paymentIntentRepository.findByPaymentIntentIdForUpdate(paymentIntentId);
        WalletPaymentIntent record = existingOpt.orElse(null);

        Long userId = extractUserId(paymentIntent, record != null ? record.getUserId() : null);
        if (userId == null) {
            log.warn("Stripe payment intent {} is missing user metadata; cannot post wallet credit", paymentIntentId);
            if (record != null) {
                record.setStatus(status);
                record.setMetadataJson(serializeMetadata(paymentIntent));
                paymentIntentRepository.save(record);
            }
            return;
        }

        if (record == null) {
            record = new WalletPaymentIntent();
            record.setPaymentIntentId(paymentIntentId);
        }
        record.setStatus(status);
        record.setMetadataJson(serializeMetadata(paymentIntent));
        record.setUserId(userId);

        String currency = paymentIntent.getCurrency() != null ? paymentIntent.getCurrency().toUpperCase() : "BDT";
        BigDecimal amount = toMajorUnits(paymentIntent.getAmountReceived() != null ? paymentIntent.getAmountReceived() : paymentIntent.getAmount(), currency);

        WalletAccount account = record.getAccount();
        if (account == null || account.getId() == null) {
            account = walletService.ensureAccount(userId, currency);
            record.setAccount(account);
        }

        String metadataIdempotency = paymentIntent.getMetadata() != null
                ? paymentIntent.getMetadata().get("idempotencyKey")
                : null;
        String existingIdempotency = record.getIdempotencyKey();
        String idempotencyKey = normalizeIdempotencyKey(StringUtils.hasText(metadataIdempotency)
                ? metadataIdempotency
                : (StringUtils.hasText(existingIdempotency) ? existingIdempotency : paymentIntentId));
        record.setIdempotencyKey(idempotencyKey);
        record.setReferenceType("STRIPE");
        record.setReferenceId(record.getReferenceId() != null ? record.getReferenceId() : paymentIntentId);
        record.setAmount(amount);
        record.setCurrency(currency);

        if (status == PaymentIntentStatus.SUCCEEDED) {
            if (record.getTransaction() != null) {
                log.info("Stripe payment intent {} already linked to transaction {}", paymentIntentId, record.getTransaction().getId());
            } else {
                WalletService.FundingResult result = walletService.fundWallet(
                        userId,
                        currency,
                        amount,
                        "STRIPE",
                        paymentIntentId,
                        idempotencyKey,
                        serializeMetadata(paymentIntent)
                );
                record.setTransaction(result.transaction());
                record.setStatus(PaymentIntentStatus.SUCCEEDED);
            }
        } else if (status == PaymentIntentStatus.CANCELED || status == PaymentIntentStatus.FAILED) {
            // leave transaction null
        }

        paymentIntentRepository.save(record);
    }

    private PaymentIntent retrievePaymentIntent(String paymentIntentId) {
        try {
            return PaymentIntent.retrieve(paymentIntentId);
        } catch (StripeException e) {
            log.error("Failed to retrieve Stripe payment intent {}", paymentIntentId, e);
            throw new BadRequestException("Unable to load existing card funding intent");
        }
    }

    private PaymentIntentStatus mapStatus(String status) {
        if (status == null) {
            return PaymentIntentStatus.REQUIRES_PAYMENT_METHOD;
        }
        return switch (status.toLowerCase()) {
            case "requires_payment_method" -> PaymentIntentStatus.REQUIRES_PAYMENT_METHOD;
            case "requires_confirmation" -> PaymentIntentStatus.REQUIRES_CONFIRMATION;
            case "requires_action" -> PaymentIntentStatus.REQUIRES_ACTION;
            case "processing" -> PaymentIntentStatus.PROCESSING;
            case "requires_capture" -> PaymentIntentStatus.REQUIRES_CAPTURE;
            case "canceled" -> PaymentIntentStatus.CANCELED;
            case "succeeded" -> PaymentIntentStatus.SUCCEEDED;
            default -> PaymentIntentStatus.FAILED;
        };
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private boolean isBdt(String currency) {
        return currency != null && "BDT".equalsIgnoreCase(currency.trim());
    }

    private String normalizeIdempotencyKey(String key) {
        String value = (key == null || key.isBlank()) ? UUID.randomUUID().toString() : key.trim();
        if (value.length() > IDEMPOTENCY_MAX_LENGTH) {
            return value.substring(0, IDEMPOTENCY_MAX_LENGTH);
        }
        return value;
    }

    private long toMinorUnits(BigDecimal amount, String currency) {
        String currencyUpper = currency != null ? currency.toUpperCase() : "BDT";
        int scale = switch (currencyUpper) {
            case "JPY", "KRW" -> 0;
            default -> 2;
        };
        return amount.movePointRight(scale).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    private BigDecimal toMajorUnits(Long amountMinor, String currency) {
        if (amountMinor == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        String currencyUpper = currency != null ? currency.toUpperCase() : "BDT";
        int scale = switch (currencyUpper) {
            case "JPY", "KRW" -> 0;
            default -> 2;
        };
        return BigDecimal.valueOf(amountMinor).movePointLeft(scale).setScale(2, RoundingMode.HALF_UP);
    }

    private String buildStripeIdempotencyKey(Long userId, String normalizedKey) {
        return userId + ":" + normalizedKey;
    }

    private String requirePaymentIntentId(String paymentIntentId) {
        if (!StringUtils.hasText(paymentIntentId)) {
            throw new BadRequestException("paymentIntentId is required");
        }
        return paymentIntentId.trim();
    }

    private Long requireUserId(Long userId) {
        if (userId == null) {
            throw new BadRequestException("User ID is required for Stripe funding");
        }
        return userId;
    }

    private void ensureStripeConfigured() {
        if (!StringUtils.hasText(stripeProperties.getSecretKey())) {
            throw new ResourceConflictException("Stripe secret key is not configured");
        }
        Stripe.apiKey = stripeProperties.getSecretKey();
    }

    private Long extractUserId(PaymentIntent paymentIntent, Long existingUserId) {
        if (existingUserId != null) {
            return existingUserId;
        }
        Map<String, String> metadata = paymentIntent.getMetadata();
        if (metadata == null) {
            return null;
        }
        String userId = metadata.get("userId");
        if (!StringUtils.hasText(userId)) {
            return null;
        }
        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException e) {
            log.warn("Invalid userId metadata on payment intent {}: {}", paymentIntent.getId(), userId);
            return null;
        }
    }

    private String serializeMetadata(PaymentIntent paymentIntent) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("metadata", paymentIntent.getMetadata());
        metadata.put("paymentMethodTypes", paymentIntent.getPaymentMethodTypes());
        metadata.put("latestCharge", paymentIntent.getLatestCharge());
        metadata.put("status", paymentIntent.getStatus());
        metadata.put("created", paymentIntent.getCreated() != null ? Instant.ofEpochSecond(paymentIntent.getCreated()) : null);
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (JsonProcessingException e) {
            log.warn("Unable to serialize Stripe metadata for intent {}", paymentIntent.getId(), e);
            return null;
        }
    }
}
