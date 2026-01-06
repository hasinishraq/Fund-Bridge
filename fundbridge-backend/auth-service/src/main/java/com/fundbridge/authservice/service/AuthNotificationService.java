package com.fundbridge.authservice.service;

import com.fundbridge.authservice.entity.OtpPurpose;
import com.fundbridge.authservice.integration.notification.NotificationClient;
import com.fundbridge.authservice.integration.notification.NotificationDispatchRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AuthNotificationService {

    private static final List<String> INAPP_CHANNEL = List.of("INAPP");

    static final String TEMPLATE_OTP_EMAIL_VERIFY = "OTP_EMAIL_VERIFY";
    static final String TEMPLATE_OTP_PASSWORD_RESET = "OTP_PASSWORD_RESET";
    static final String TEMPLATE_OTP_LOGIN_2FA = "OTP_LOGIN_2FA";

    private final NotificationClient notificationClient;

    public AuthNotificationService(NotificationClient notificationClient) {
        this.notificationClient = notificationClient;
    }

    public void notifyOtpInApp(Long userId, OtpPurpose purpose, String otp, long ttlMinutes) {
        if (userId == null || purpose == null || otp == null || otp.isBlank()) {
            return;
        }
        String templateKey = switch (purpose) {
            case EMAIL_VERIFY -> TEMPLATE_OTP_EMAIL_VERIFY;
            case PASSWORD_RESET -> TEMPLATE_OTP_PASSWORD_RESET;
            case LOGIN_2FA -> TEMPLATE_OTP_LOGIN_2FA;
        };
        Map<String, Object> payload = Map.of(
                "otp", otp,
                "ttlMinutes", ttlMinutes,
                "purpose", purpose.name()
        );
        notificationClient.dispatch(new NotificationDispatchRequest(
                userId,
                templateKey,
                payload,
                INAPP_CHANNEL,
                null,
                null
        ));
    }
}
