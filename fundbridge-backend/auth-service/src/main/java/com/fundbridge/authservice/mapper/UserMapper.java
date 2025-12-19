package com.fundbridge.authservice.mapper;

import com.fundbridge.authservice.dto.UserResponse;
import com.fundbridge.authservice.dto.UserSettingsResponse;
import com.fundbridge.authservice.entity.UserAccount;
import com.fundbridge.authservice.entity.UserSettings;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(UserAccount user) {
        if (user == null) {
            return null;
        }
        UserSettings settings = user.getSettings();
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.isEmailVerified(),
                user.getStatus(),
                user.getPrimaryRole(),
                user.getKycApplicantId(),
                user.getKycStatus(),
                user.getKycReviewUrl(),
                user.getKycLastSyncedAt(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                settings == null ? null : new UserSettingsResponse(
                        settings.getLocale(),
                        settings.isEmailNotifications(),
                        settings.isSmsNotifications()
                )
        );
    }
}
