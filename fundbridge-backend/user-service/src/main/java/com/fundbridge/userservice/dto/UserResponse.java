package com.fundbridge.userservice.dto;

import com.fundbridge.userservice.entity.KycStatus;
import com.fundbridge.userservice.entity.UserRole;

import java.time.Instant;

public record UserResponse(
        Long id,
        String name,
        String email,
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
