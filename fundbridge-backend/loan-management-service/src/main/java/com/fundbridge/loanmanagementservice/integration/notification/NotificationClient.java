package com.fundbridge.loanmanagementservice.integration.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Component
public class NotificationClient {

    private static final Logger log = LoggerFactory.getLogger(NotificationClient.class);

    private final RestTemplate restTemplate;
    private final NotificationClientProperties properties;

    public NotificationClient(RestTemplate restTemplate, NotificationClientProperties properties) {
        this.restTemplate = restTemplate;
        this.properties = properties;
    }

    public void dispatch(NotificationDispatchRequest request) {
        if (request == null || properties.getBaseUrl() == null || properties.getBaseUrl().isBlank()) {
            return;
        }
        URI uri = UriComponentsBuilder.fromHttpUrl(properties.getBaseUrl())
                .path("/notifications/dispatch")
                .build()
                .toUri();
        try {
            restTemplate.postForEntity(uri, request, Void.class);
        } catch (RestClientException ex) {
            log.warn("Failed to dispatch notification template={} userId={}",
                    request.templateKey(), request.userId(), ex);
        }
    }
}
