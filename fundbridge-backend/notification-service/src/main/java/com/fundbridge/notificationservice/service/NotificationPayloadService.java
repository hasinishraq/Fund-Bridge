package com.fundbridge.notificationservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fundbridge.notificationservice.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class NotificationPayloadService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public NotificationPayloadService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String writePayload(Map<String, Object> payload) {
        try {
            Map<String, Object> safePayload = payload == null ? Map.of() : payload;
            return objectMapper.writeValueAsString(safePayload);
        } catch (JsonProcessingException ex) {
            throw new BadRequestException("Unable to serialize payload");
        }
    }

    public Map<String, Object> readPayload(String payloadJson) {
        try {
            if (payloadJson == null || payloadJson.isBlank()) {
                return Map.of();
            }
            return objectMapper.readValue(payloadJson, MAP_TYPE);
        } catch (JsonProcessingException ex) {
            throw new BadRequestException("Unable to parse payload JSON");
        }
    }
}
