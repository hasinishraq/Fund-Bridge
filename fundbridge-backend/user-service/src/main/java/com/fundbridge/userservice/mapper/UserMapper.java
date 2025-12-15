package com.fundbridge.userservice.mapper;

import com.fundbridge.userservice.dto.UserResponse;
import com.fundbridge.userservice.dto.UserSettingsResponse;
import com.fundbridge.userservice.entity.UserAccount;
import com.fundbridge.userservice.entity.UserSettings;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(UserAccount user) {
        UserSettings settings = user.getSettings();
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
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
