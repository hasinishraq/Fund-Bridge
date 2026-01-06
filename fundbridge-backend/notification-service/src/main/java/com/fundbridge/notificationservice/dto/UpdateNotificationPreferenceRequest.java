package com.fundbridge.notificationservice.dto;

public record UpdateNotificationPreferenceRequest(
        Boolean emailEnabled,
        Boolean smsEnabled,
        Boolean inappEnabled
) {
}
