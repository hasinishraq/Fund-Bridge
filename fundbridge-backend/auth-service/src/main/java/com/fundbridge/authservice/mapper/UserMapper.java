package com.fundbridge.authservice.mapper;

import com.fundbridge.authservice.dto.UserResponse;
import com.fundbridge.authservice.entity.UserAccount;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(UserAccount user) {
        if (user == null) {
            return null;
        }
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getKycApplicantId(),
                user.getKycStatus(),
                user.getKycReviewUrl()
        );
    }
}
