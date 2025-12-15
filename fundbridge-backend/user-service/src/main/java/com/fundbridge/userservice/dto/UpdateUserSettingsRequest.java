package com.fundbridge.userservice.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserSettingsRequest(
        @Size(max = 12, message = "Locale code must be 12 characters or less")
        String locale,
        Boolean emailNotifications,
        Boolean smsNotifications
) {
}
