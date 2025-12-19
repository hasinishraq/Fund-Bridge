package com.fundbridge.authservice.dto;

import com.fundbridge.authservice.entity.KycStatus;
import com.fundbridge.authservice.entity.UserRole;
import com.fundbridge.authservice.entity.UserStatus;

import java.time.Instant;

public record UserResponse(
        Long id,
        String name,
        String email,
        boolean emailVerified,
        UserStatus status,
        UserRole role,
        String kycApplicantId,
        KycStatus kycStatus,
        String kycReviewUrl,
        Instant kycLastSyncedAt,
        Instant createdAt,
        Instant updatedAt,
        UserSettingsResponse settings
) {
}
