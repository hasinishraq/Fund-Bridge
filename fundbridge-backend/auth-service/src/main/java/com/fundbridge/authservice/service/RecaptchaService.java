package com.fundbridge.authservice.service;

import com.fundbridge.authservice.config.RecaptchaProperties;
import com.fundbridge.authservice.exception.InvalidCaptchaException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;

@Service
public class RecaptchaService {

    private static final Logger log = LoggerFactory.getLogger(RecaptchaService.class);

    private final RecaptchaProperties properties;
    private final RestTemplate restTemplate;

    public RecaptchaService(RecaptchaProperties properties, RestTemplateBuilder restTemplateBuilder) {
        this.properties = properties;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(5))
                .build();
    }

    public void verify(String captchaToken) {
        if (!properties.isEnabled()) {
            return;
        }

        if (!StringUtils.hasText(captchaToken)) {
            throw new InvalidCaptchaException("Captcha validation failed");
        }

        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("secret", properties.getSecretKey());
            body.add("response", captchaToken);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            RecaptchaResponse response = restTemplate.postForObject(
                    properties.getVerifyUrl(),
                    request,
                    RecaptchaResponse.class
            );

            if (response == null || Boolean.FALSE.equals(response.success())) {
                log.warn("reCAPTCHA verification failed: {}", response);
                throw new InvalidCaptchaException("Captcha validation failed");
            }

            if (response.score() != null && response.score() < properties.getMinimumScore()) {
                log.warn("reCAPTCHA score {} below threshold {}", response.score(), properties.getMinimumScore());
                throw new InvalidCaptchaException("Captcha validation failed");
            }
        } catch (RestClientException exception) {
            log.error("Unable to verify reCAPTCHA", exception);
            throw new InvalidCaptchaException("Captcha validation failed");
        }
    }

    private record RecaptchaResponse(
            Boolean success,
            Double score,
            String action,
            String challenge_ts,
            String hostname,
            List<String> errorCodes
    ) {
    }
}
