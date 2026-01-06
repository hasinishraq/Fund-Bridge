package com.fundbridge.notificationservice.service;

import com.fundbridge.notificationservice.dto.NotificationPreferenceResponse;
import com.fundbridge.notificationservice.dto.UpdateNotificationPreferenceRequest;
import com.fundbridge.notificationservice.entity.NotificationPreference;
import com.fundbridge.notificationservice.mapper.NotificationMapper;
import com.fundbridge.notificationservice.repository.NotificationPreferenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;

    public NotificationPreferenceService(NotificationPreferenceRepository preferenceRepository) {
        this.preferenceRepository = preferenceRepository;
    }

    public NotificationPreferenceResponse getPreferences(Long userId) {
        NotificationPreference preference = resolvePreferences(userId);
        return NotificationMapper.toPreferenceResponse(preference);
    }

    @Transactional
    public NotificationPreferenceResponse updatePreferences(Long userId, UpdateNotificationPreferenceRequest request) {
        NotificationPreference preference = preferenceRepository.findById(userId)
                .orElseGet(() -> new NotificationPreference(userId));

        if (request.emailEnabled() != null) {
            preference.setEmailEnabled(request.emailEnabled());
        }
        if (request.smsEnabled() != null) {
            preference.setSmsEnabled(request.smsEnabled());
        }
        if (request.inappEnabled() != null) {
            preference.setInappEnabled(request.inappEnabled());
        }

        NotificationPreference saved = preferenceRepository.save(preference);
        return NotificationMapper.toPreferenceResponse(saved);
    }

    public NotificationPreference resolvePreferences(Long userId) {
        return preferenceRepository.findById(userId)
                .orElseGet(() -> NotificationPreference.defaultFor(userId));
    }
}
