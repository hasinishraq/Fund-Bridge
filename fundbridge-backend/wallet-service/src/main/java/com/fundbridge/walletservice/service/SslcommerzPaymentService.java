package com.fundbridge.walletservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fundbridge.walletservice.config.SslcommerzProperties;
import com.fundbridge.walletservice.dto.SslcommerzPaymentIntentResponse;
import com.fundbridge.walletservice.dto.SslcommerzTopUpRequest;
import com.fundbridge.walletservice.dto.SslcommerzValidateRequest;
import com.fundbridge.walletservice.entity.PaymentIntentStatus;
import com.fundbridge.walletservice.entity.WalletAccount;
import com.fundbridge.walletservice.entity.WalletPaymentIntent;
import com.fundbridge.walletservice.exception.BadRequestException;
import com.fundbridge.walletservice.exception.ResourceConflictException;
import com.fundbridge.walletservice.exception.ResourceNotFoundException;
import com.fundbridge.walletservice.repository.WalletPaymentIntentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class SslcommerzPaymentService {

    private static final Logger log = LoggerFactory.getLogger(SslcommerzPaymentService.class);
    private static final int IDEMPOTENCY_MAX_LENGTH = 80;
    private static final String PROVIDER_NAME = "SSLCOMMERZ";
    private static final BigDecimal MIN_BDT_AMOUNT = new BigDecimal("10.00");

    private final SslcommerzProperties sslProps;
    private final WalletService walletService;
    private final WalletNotificationService walletNotificationService;
    private final WalletPaymentIntentRepository paymentIntentRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public SslcommerzPaymentService(SslcommerzProperties sslProps,
                                    WalletService walletService,
                                    WalletNotificationService walletNotificationService,
                                    WalletPaymentIntentRepository paymentIntentRepository,
                                    ObjectMapper objectMapper) {
        this.sslProps = sslProps;
        this.walletService = walletService;
        this.walletNotificationService = walletNotificationService;
        this.paymentIntentRepository = paymentIntentRepository;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    @Transactional
    public SslcommerzPaymentIntentResponse createTopUpIntent(SslcommerzTopUpRequest request) {
        ensureConfigured();
        Long userId = requireUserId(request.userId());
        BigDecimal normalizedAmount = normalizeAmount(request.amount());
        if (normalizedAmount.compareTo(MIN_BDT_AMOUNT) < 0) {
            throw new BadRequestException("Minimum SSLCommerz top up is " + MIN_BDT_AMOUNT.toPlainString());
        }
        String normalizedCurrency = normalizeCurrency(request.currency());
        WalletAccount account = walletService.ensureAccount(userId, normalizedCurrency);
        String idempotencyKey = normalizeIdempotencyKey(request.idempotencyKey());

        Optional<WalletPaymentIntent> existingOpt = paymentIntentRepository.findByUserIdAndIdempotencyKeyForUpdate(userId, idempotencyKey);
        if (existingOpt.isPresent()) {
            WalletPaymentIntent existing = existingOpt.get();
            if (!PROVIDER_NAME.equalsIgnoreCase(existing.getProvider())) {
                throw new ResourceConflictException("Idempotency key already used for " + existing.getProvider());
            }
            return toResponse(existing, existing.getMetadataJson(), "Reusing existing SSLCommerz session");
        }

        String tranId = buildTranId(idempotencyKey);
        SslCreateResponse createResponse = createSession(normalizedAmount, account.getCurrency(), tranId, request);
        PaymentIntentStatus status = mapStatus(createResponse.status());

        WalletPaymentIntent record = new WalletPaymentIntent();
        record.setProvider(PROVIDER_NAME);
        record.setPaymentIntentId(tranId);
        record.setStatus(status);
        record.setAmount(normalizedAmount);
        record.setCurrency(account.getCurrency());
        record.setUserId(userId);
        record.setAccount(account);
        record.setIdempotencyKey(idempotencyKey);
        record.setReferenceType(PROVIDER_NAME);
        record.setReferenceId(request.referenceId() != null ? request.referenceId() : tranId);
        record.setMetadataJson(serialize(createResponse));
        paymentIntentRepository.save(record);

        return new SslcommerzPaymentIntentResponse(
                tranId,
                createResponse.gatewayPageUrl(),
                status,
                normalizedAmount,
                account.getCurrency(),
                account.getId(),
                null,
                createResponse.failedreason()
        );
    }

    @Transactional
    public SslcommerzPaymentIntentResponse validate(SslcommerzValidateRequest request) {
        ensureConfigured();
        String tranId = requireTranId(request.tranId());
        WalletPaymentIntent intent = paymentIntentRepository.findByPaymentIntentIdForUpdate(tranId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment intent not found for tranId " + tranId));
        if (!PROVIDER_NAME.equalsIgnoreCase(intent.getProvider())) {
            throw new ResourceConflictException("Payment intent does not belong to SSLCommerz");
        }
        if (!intent.getUserId().equals(request.userId())) {
            throw new ResourceConflictException("Payment intent does not belong to the requesting user");
        }

        SslValidationResponse validation = StringUtils.hasText(request.valId())
                ? validateWithValId(request.valId())
                : validateWithGateway(tranId);
        PaymentIntentStatus status = mapStatus(validation.status());
        intent.setStatus(status);
        intent.setMetadataJson(serialize(validation));

        Long transactionId = null;
        if (status == PaymentIntentStatus.SUCCEEDED) {
            if (intent.getTransaction() == null) {
                WalletService.FundingResult result = walletService.fundWallet(
                        intent.getUserId(),
                        intent.getCurrency(),
                        intent.getAmount(),
                        PROVIDER_NAME,
                        intent.getPaymentIntentId(),
                        intent.getIdempotencyKey(),
                        serialize(validation)
                );
                intent.setTransaction(result.transaction());
                transactionId = result.transaction().getId();
            } else {
                transactionId = intent.getTransaction().getId();
            }
        }
        paymentIntentRepository.save(intent);
        if (status == PaymentIntentStatus.CANCELED) {
            walletNotificationService.notifyTopUpFailure(
                    intent.getUserId(),
                    intent.getAmount(),
                    intent.getCurrency(),
                    PROVIDER_NAME,
                    tranId,
                    validation.status()
            );
        }

        return new SslcommerzPaymentIntentResponse(
                tranId,
                null,
                status,
                intent.getAmount(),
                intent.getCurrency(),
                intent.getAccount().getId(),
                transactionId,
                validation.status()
        );
    }

    private SslcommerzPaymentIntentResponse toResponse(WalletPaymentIntent intent, String metadataJson, String message) {
        return new SslcommerzPaymentIntentResponse(
                intent.getPaymentIntentId(),
                extractRedirectUrl(metadataJson),
                intent.getStatus(),
                intent.getAmount(),
                intent.getCurrency(),
                intent.getAccount().getId(),
                intent.getTransaction() != null ? intent.getTransaction().getId() : null,
                message
        );
    }

    private SslCreateResponse createSession(BigDecimal amount,
                                            String currency,
                                            String tranId,
                                            SslcommerzTopUpRequest request) {
        Map<String, String> payload = new HashMap<>();
        payload.put("store_id", sslProps.getStoreId());
        payload.put("store_passwd", sslProps.getStorePassword());
        payload.put("total_amount", amount.setScale(2, RoundingMode.HALF_UP).toPlainString());
        payload.put("currency", currency);
        payload.put("tran_id", tranId);
        payload.put("success_url", sslProps.getSuccessUrl());
        payload.put("fail_url", sslProps.getFailUrl());
        payload.put("cancel_url", sslProps.getCancelUrl());
        payload.put("emi_option", "0");
        payload.put("cus_name", fallback(request.customerName(), "FundBridge User"));
        payload.put("cus_email", fallback(request.customerEmail(), "no-reply@fundbridge.local"));
        payload.put("cus_add1", "N/A");
        payload.put("cus_city", "Dhaka");
        payload.put("cus_country", "BD");
        payload.put("cus_phone", fallback(request.customerPhone(), String.valueOf(request.userId())));
        payload.put("product_name", "Wallet Top Up");
        payload.put("product_category", "Wallet");
        payload.put("product_profile", "general");
        payload.put("value_a", String.valueOf(request.userId()));
        payload.put("shipping_method", "NO");
        payload.put("num_of_item", "1");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        try {
            ResponseEntity<SslCreateResponse> response = restTemplate.exchange(
                    sslProps.getApiBaseUrl() + "/gwprocess/v4/api.php",
                    HttpMethod.POST,
                    new HttpEntity<>(buildFormBody(payload), headers),
                    SslCreateResponse.class
            );
            SslCreateResponse create = response.getBody();
            if (create == null || !StringUtils.hasText(create.status())) {
                throw new BadRequestException("Unable to start SSLCommerz payment");
            }
            if (!"SUCCESS".equalsIgnoreCase(create.status())) {
                throw new BadRequestException("SSLCommerz rejected request: " + fallback(create.failedreason(), create.status()));
            }
            if (!StringUtils.hasText(create.gatewayPageUrl())) {
                throw new BadRequestException("Missing SSLCommerz checkout URL");
            }
            return create;
        } catch (RestClientException ex) {
            log.error("Failed to create SSLCommerz session", ex);
            throw new BadRequestException("Unable to start SSLCommerz payment right now");
        }
    }

    private SslValidationResponse validateWithGateway(String tranId) {
        String url = sslProps.getApiBaseUrl() +
                "/validator/api/merchantTransIDvalidationAPI.php?tran_id=" + tranId +
                "&store_id=" + sslProps.getStoreId() +
                "&store_passwd=" + sslProps.getStorePassword() +
                "&format=json";
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            SslValidationResponse validation = parseValidationResponse(response.getBody());
            if (validation == null) {
                throw new BadRequestException("No validation response received from SSLCommerz");
            }
            if (!StringUtils.hasText(validation.status())) {
                throw new BadRequestException("SSLCommerz validation returned no status");
            }
            return validation;
        } catch (RestClientException ex) {
            log.error("Failed to validate SSLCommerz transaction {}", tranId, ex);
            throw new BadRequestException("Unable to validate SSLCommerz payment right now");
        }
    }

    // SSLCommerz responses can be arrays or object wrappers; handle both shapes.
    private SslValidationResponse parseValidationResponse(String body) {
        if (!StringUtils.hasText(body)) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            return extractValidationResponse(root);
        } catch (JsonProcessingException e) {
            log.warn("Unable to parse SSLCommerz validation response", e);
            return null;
        }
    }

    private SslValidationResponse extractValidationResponse(JsonNode node) throws JsonProcessingException {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isArray()) {
            return node.isEmpty() ? null : extractValidationResponse(node.get(0));
        }
        if (node.isObject()) {
            JsonNode element = node.get("element");
            if (element != null) {
                SslValidationResponse fromElement = extractValidationResponse(element);
                if (fromElement != null) {
                    return fromElement;
                }
            }
            JsonNode data = node.get("data");
            if (data != null) {
                SslValidationResponse fromData = extractValidationResponse(data);
                if (fromData != null) {
                    return fromData;
                }
            }
            return objectMapper.treeToValue(node, SslValidationResponse.class);
        }
        return null;
    }

    private SslValidationResponse validateWithValId(String valId) {
        String url = sslProps.getApiBaseUrl() +
                "/validator/api/validationserverAPI.php?val_id=" + valId +
                "&store_id=" + sslProps.getStoreId() +
                "&store_passwd=" + sslProps.getStorePassword() +
                "&v=1&format=json";
        try {
            ResponseEntity<SslValidationResponse> response = restTemplate.getForEntity(url, SslValidationResponse.class);
            SslValidationResponse body = response.getBody();
            if (body == null) {
                throw new BadRequestException("Empty validation response received from SSLCommerz");
            }
            if (!StringUtils.hasText(body.status())) {
                throw new BadRequestException("SSLCommerz validation returned no status");
            }
            return body;
        } catch (RestClientException ex) {
            log.error("Failed to validate SSLCommerz val_id {}", valId, ex);
            throw new BadRequestException("Unable to validate SSLCommerz payment right now");
        }
    }

    private String extractRedirectUrl(String metadataJson) {
        if (!StringUtils.hasText(metadataJson)) {
            return null;
        }
        try {
            Map<?, ?> data = objectMapper.readValue(metadataJson, Map.class);
            Object url = data.get("GatewayPageURL");
            if (url == null) {
                url = data.get("gatewayPageUrl");
            }
            return url != null ? url.toString() : null;
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private PaymentIntentStatus mapStatus(String status) {
        if (status == null) {
            return PaymentIntentStatus.PROCESSING;
        }
        return switch (status.toUpperCase()) {
            case "VALID", "VALIDATED", "SUCCESS", "COMPLETED" -> PaymentIntentStatus.SUCCEEDED;
            case "FAILED", "CANCELLED", "CANCELED" -> PaymentIntentStatus.CANCELED;
            case "PROCESSING", "PENDING" -> PaymentIntentStatus.PROCESSING;
            default -> PaymentIntentStatus.PROCESSING;
        };
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "BDT";
        }
        String normalized = currency.trim().toUpperCase();
        if (!"BDT".equals(normalized)) {
            throw new ResourceConflictException("SSLCommerz supports BDT currency only");
        }
        return normalized;
    }

    private String normalizeIdempotencyKey(String key) {
        String value = (key == null || key.isBlank()) ? UUID.randomUUID().toString() : key.trim();
        if (value.length() > IDEMPOTENCY_MAX_LENGTH) {
            return value.substring(0, IDEMPOTENCY_MAX_LENGTH);
        }
        return value;
    }

    private String buildTranId(String idempotencyKey) {
        String raw = "wallet-ssl-" + idempotencyKey;
        return raw.length() > 64 ? raw.substring(0, 64) : raw;
    }

    private void ensureConfigured() {
        if (!sslProps.isEnabled()) {
            throw new ResourceConflictException("SSLCommerz payments are disabled");
        }
        if (!StringUtils.hasText(sslProps.getStoreId()) ||
                !StringUtils.hasText(sslProps.getStorePassword()) ||
                !StringUtils.hasText(sslProps.getApiBaseUrl())) {
            throw new ResourceConflictException("SSLCommerz credentials are not configured");
        }
    }

    private Long requireUserId(Long userId) {
        if (userId == null) {
            throw new BadRequestException("User ID is required for SSLCommerz funding");
        }
        return userId;
    }

    private String requireTranId(String tranId) {
        if (!StringUtils.hasText(tranId)) {
            throw new BadRequestException("tranId is required");
        }
        return tranId.trim();
    }

    private String serialize(Object data) {
        if (data == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            log.warn("Unable to serialize SSLCommerz payload", e);
            return null;
        }
    }

    private String fallback(String value, String defaultValue) {
        return StringUtils.hasText(value) ? value : defaultValue;
    }

    private org.springframework.util.MultiValueMap<String, String> buildFormBody(Map<String, String> payload) {
        org.springframework.util.LinkedMultiValueMap<String, String> form = new org.springframework.util.LinkedMultiValueMap<>();
        payload.forEach(form::add);
        return form;
    }

    private record SslCreateResponse(
            @JsonProperty("status") String status,
            @JsonProperty("failedreason") String failedreason,
            @JsonProperty("GatewayPageURL") String gatewayPageUrl,
            @JsonProperty("sessionkey") String sessionKey
    ) {
    }

    private record SslValidationResponse(
            @JsonProperty("status") String status,
            @JsonProperty("tran_id") String tranId,
            @JsonProperty("amount") String amount,
            @JsonProperty("currency") String currency,
            @JsonProperty("val_id") String valId,
            @JsonProperty("card_issuer") String cardIssuer,
            @JsonProperty("card_brand") String cardBrand,
            @JsonProperty("risk_title") String riskTitle,
            @JsonProperty("value_a") String valueA,
            @JsonProperty("value_b") String valueB,
            @JsonProperty("value_c") String valueC,
            @JsonProperty("value_d") String valueD
    ) {
    }
}
