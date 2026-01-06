package com.fundbridge.userservice.service;

import com.fundbridge.userservice.entity.KycStatus;
import com.fundbridge.userservice.entity.UserAccount;
import com.fundbridge.userservice.integration.notification.NotificationClient;
import com.fundbridge.userservice.integration.notification.NotificationDispatchRequest;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserNotificationService {

    private static final List<String> DEFAULT_CHANNELS = List.of("EMAIL", "INAPP");

    static final String TEMPLATE_KYC_APPROVED = "KYC_APPROVED";
    static final String TEMPLATE_KYC_REJECTED = "KYC_REJECTED";

    private final NotificationClient notificationClient;

    public UserNotificationService(NotificationClient notificationClient) {
        this.notificationClient = notificationClient;
    }

    public void notifyKycStatus(UserAccount userAccount, KycStatus status) {
        if (userAccount == null || userAccount.getId() == null || status == null) {
            return;
        }
        String templateKey = status == KycStatus.APPROVED
                ? TEMPLATE_KYC_APPROVED
                : (status == KycStatus.REJECTED ? TEMPLATE_KYC_REJECTED : null);
        if (templateKey == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", userAccount.getId());
        payload.put("email", userAccount.getEmail());
        payload.put("kycStatus", status.name());
        payload.put("applicantId", userAccount.getKycApplicantId());
        payload.put("reviewUrl", userAccount.getKycReviewUrl());
        String idempotency = "kyc:" + userAccount.getId() + ":" + status.name().toLowerCase();
        notificationClient.dispatch(new NotificationDispatchRequest(
                userAccount.getId(),
                templateKey,
                payload,
                DEFAULT_CHANNELS,
                null,
                idempotency
        ));
    }
}
