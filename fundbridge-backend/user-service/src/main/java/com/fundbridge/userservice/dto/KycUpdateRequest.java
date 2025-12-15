package com.fundbridge.userservice.dto;

import com.fundbridge.userservice.entity.KycStatus;
import jakarta.validation.constraints.Size;

public record KycUpdateRequest(
        @Size(max = 96, message = "Applicant id must be 96 characters or less")
        String applicantId,
        KycStatus status,
        @Size(max = 1024, message = "Review url must be 1024 characters or less")
        String reviewUrl
) {
}
