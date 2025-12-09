package com.fundbridge.authservice.dto;

import com.fundbridge.authservice.entity.KycStatus;
import com.fundbridge.authservice.entity.UserRole;

public record UserResponse(
        Long id,
        String name,
        String email,
        UserRole role,
        String kycApplicantId,
        KycStatus kycStatus,
        String kycReviewUrl
) {
}
