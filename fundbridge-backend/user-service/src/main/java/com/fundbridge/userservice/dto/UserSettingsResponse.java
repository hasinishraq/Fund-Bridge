package com.fundbridge.userservice.dto;

public record UserSettingsResponse(
        String locale,
        boolean emailNotifications,
        boolean smsNotifications
) {
}
