package com.fundbridge.kycservice.sumsub;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fundbridge.kycservice.config.SumsubProperties;
import com.fundbridge.kycservice.exception.KycProviderException;
import com.fundbridge.kycservice.sumsub.dto.SumsubApplicantPayload;
import com.fundbridge.kycservice.sumsub.dto.SumsubApplicantResponse;
import com.fundbridge.kycservice.sumsub.dto.SumsubWebSdkLinkRequest;
import com.fundbridge.kycservice.sumsub.dto.SumsubWebSdkLinkResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;

@Component
public class SumsubClient {

    private static final Logger log = LoggerFactory.getLogger(SumsubClient.class);

    private final RestClient restClient;
    private final SumsubProperties properties;
    private final ObjectMapper objectMapper;

    public SumsubClient(SumsubProperties properties, RestClient.Builder builder, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.restClient = builder
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    public SumsubApplicantResponse createApplicant(SumsubApplicantPayload payload, String levelName) {
        String path = UriComponentsBuilder.fromPath("/resources/applicants")
                .queryParam("levelName", levelName)
                .build()
                .toUriString();
        return exchange(HttpMethod.POST, path, payload, SumsubApplicantResponse.class);
    }

    public SumsubWebSdkLinkResponse createWebSdkLink(SumsubWebSdkLinkRequest request) {
        String path = "/resources/applicants/-/websdkLink";
        return exchange(HttpMethod.POST, path, request, SumsubWebSdkLinkResponse.class);
    }

    private <T> T exchange(HttpMethod method, String path, Object body, Class<T> targetClass) {
        try {
            byte[] payload = body == null ? new byte[0] : objectMapper.writeValueAsBytes(body);
            HttpHeaders headers = buildHeaders(method.name(), path, payload);
            RestClient.RequestBodySpec spec = restClient.method(method)
                    .uri(path)
                    .headers(httpHeaders -> httpHeaders.addAll(headers));

            RestClient.ResponseSpec responseSpec = payload.length == 0
                    ? spec.retrieve()
                    : spec.body(payload).retrieve();
            return responseSpec.body(targetClass);
        } catch (JsonProcessingException exception) {
            log.error("Unable to serialize payload for {}", path, exception);
            throw new KycProviderException("Unable to serialize request for Sumsub", exception);
        } catch (RestClientException exception) {
            log.error("Sumsub request failed: {} {}", method, path, exception);
            throw new KycProviderException("KYC provider request failed", exception);
        }
    }

    private HttpHeaders buildHeaders(String method, String path, byte[] body) {
        validateCredentials();
        long timestamp = Instant.now().getEpochSecond();
        String payload = body.length == 0 ? "" : new String(body, StandardCharsets.UTF_8);
        String stringToSign = timestamp + method + path + payload;
        byte[] signatureBytes = sign(stringToSign);
        String signature = HexFormat.of().formatHex(signatureBytes);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-App-Token", properties.getAppToken());
        headers.set("X-App-Access-Ts", String.valueOf(timestamp));
        headers.set("X-App-Access-Sig", signature);
        return headers;
    }

    private byte[] sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.getSecretKey().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        } catch (Exception exception) {
            throw new KycProviderException("Unable to sign Sumsub request", exception);
        }
    }

    private void validateCredentials() {
        if (!StringUtils.hasText(properties.getAppToken()) || !StringUtils.hasText(properties.getSecretKey())) {
            throw new KycProviderException("Sumsub credentials are not configured");
        }
    }
}
