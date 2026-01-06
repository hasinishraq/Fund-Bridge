package com.fundbridge.loanmanagementservice.integration.wallet;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fundbridge.loanmanagementservice.config.WalletClientProperties;
import com.fundbridge.loanmanagementservice.exception.BadRequestException;
import com.fundbridge.loanmanagementservice.exception.ResourceConflictException;
import com.fundbridge.loanmanagementservice.exception.ResourceNotFoundException;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.CaptureHoldRequest;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.CreateHoldRequest;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.ReleaseHoldRequest;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.WalletHoldResponse;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.WalletSummaryResponse;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.WalletTransactionResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Component
public class WalletClient {

    private final RestTemplate restTemplate;
    private final WalletClientProperties properties;
    private final ObjectMapper objectMapper;

    public WalletClient(RestTemplate restTemplate,
                        WalletClientProperties properties,
                        ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public WalletSummaryResponse getWallet(Long userId, String currency) {
        URI uri = UriComponentsBuilder.fromHttpUrl(properties.getBaseUrl())
                .path("/wallet")
                .queryParam("userId", userId)
                .queryParam("currency", currency)
                .build()
                .toUri();
        try {
            return restTemplate.getForObject(uri, WalletSummaryResponse.class);
        } catch (HttpStatusCodeException ex) {
            throw translateException(ex, "Failed to load wallet");
        } catch (RestClientException ex) {
            throw new BadRequestException("Wallet service unavailable");
        }
    }

    public WalletHoldResponse createHold(CreateHoldRequest request) {
        URI uri = UriComponentsBuilder.fromHttpUrl(properties.getBaseUrl())
                .path("/wallet/holds")
                .build()
                .toUri();
        try {
            return restTemplate.postForObject(uri, request, WalletHoldResponse.class);
        } catch (HttpStatusCodeException ex) {
            throw translateException(ex, "Failed to create wallet hold");
        } catch (RestClientException ex) {
            throw new BadRequestException("Wallet service unavailable");
        }
    }

    public WalletHoldResponse releaseHold(Long holdId, ReleaseHoldRequest request) {
        URI uri = UriComponentsBuilder.fromHttpUrl(properties.getBaseUrl())
                .path("/wallet/holds/{holdId}/release")
                .buildAndExpand(holdId)
                .toUri();
        try {
            return restTemplate.postForObject(uri, request, WalletHoldResponse.class);
        } catch (HttpStatusCodeException ex) {
            throw translateException(ex, "Failed to release wallet hold");
        } catch (RestClientException ex) {
            throw new BadRequestException("Wallet service unavailable");
        }
    }

    public WalletTransactionResponse captureHold(Long holdId, CaptureHoldRequest request) {
        URI uri = UriComponentsBuilder.fromHttpUrl(properties.getBaseUrl())
                .path("/wallet/holds/{holdId}/capture")
                .buildAndExpand(holdId)
                .toUri();
        try {
            return restTemplate.postForObject(uri, request, WalletTransactionResponse.class);
        } catch (HttpStatusCodeException ex) {
            throw translateException(ex, "Failed to capture wallet hold");
        } catch (RestClientException ex) {
            throw new BadRequestException("Wallet service unavailable");
        }
    }

    private RuntimeException translateException(HttpStatusCodeException ex, String fallbackMessage) {
        String message = extractMessage(ex.getResponseBodyAsString());
        if (message == null || message.isBlank()) {
            message = fallbackMessage;
        }
        int status = ex.getStatusCode().value();
        if (status == 404) {
            return new ResourceNotFoundException(message);
        }
        if (status == 409) {
            return new ResourceConflictException(message);
        }
        return new BadRequestException(message);
    }

    private String extractMessage(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }
        try {
            JsonNode node = objectMapper.readTree(body);
            JsonNode message = node.get("message");
            if (message != null && !message.isNull()) {
                return message.asText();
            }
        } catch (Exception ignored) {
            return body;
        }
        return body;
    }
}
