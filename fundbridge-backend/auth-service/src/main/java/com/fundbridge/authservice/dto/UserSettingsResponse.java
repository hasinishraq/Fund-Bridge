package com.fundbridge.authservice.dto;

public record UserSettingsResponse(
        String locale,
        boolean emailNotifications,
        boolean smsNotifications
) {
}
