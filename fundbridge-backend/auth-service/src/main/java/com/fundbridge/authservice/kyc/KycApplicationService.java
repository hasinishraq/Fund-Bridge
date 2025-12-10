package com.fundbridge.authservice.kyc;

import com.fundbridge.authservice.entity.KycStatus;
import com.fundbridge.authservice.kyc.config.SumsubProperties;
import com.fundbridge.authservice.kyc.dto.CreateApplicantRequest;
import com.fundbridge.authservice.kyc.dto.KycApplicantResponse;
import com.fundbridge.authservice.kyc.exception.KycProviderException;
import com.fundbridge.authservice.kyc.sumsub.SumsubClient;
import com.fundbridge.authservice.kyc.sumsub.dto.SumsubApplicantPayload;
import com.fundbridge.authservice.kyc.sumsub.dto.SumsubApplicantResponse;
import com.fundbridge.authservice.kyc.sumsub.dto.SumsubWebSdkLinkRequest;
import com.fundbridge.authservice.kyc.sumsub.dto.SumsubWebSdkLinkResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Locale;

@Service
public class KycApplicationService {

    private static final Logger log = LoggerFactory.getLogger(KycApplicationService.class);

    private final SumsubClient sumsubClient;
    private final SumsubProperties properties;

    public KycApplicationService(SumsubClient sumsubClient, SumsubProperties properties) {
        this.sumsubClient = sumsubClient;
        this.properties = properties;
    }

    public KycApplicantResponse createApplicant(CreateApplicantRequest request) {
        String externalUserId = "fundbridge-user-" + request.userId();

        if (!properties.isEnabled()) {
            return buildStubResponse(externalUserId);
        }

        try {
            SumsubApplicantPayload payload = buildApplicantPayload(request, externalUserId);
            SumsubApplicantResponse applicantResponse = sumsubClient.createApplicant(payload, properties.getLevelName());
            if (applicantResponse == null || !StringUtils.hasText(applicantResponse.id())) {
                throw new KycProviderException("KYC provider returned an invalid applicant response");
            }
            String reviewUrl = null;
            try {
                SumsubWebSdkLinkResponse webSdkLink = sumsubClient.createWebSdkLink(
                        new SumsubWebSdkLinkRequest(externalUserId, properties.getLevelName(), properties.getWebsdkTtlSeconds())
                );
                reviewUrl = webSdkLink != null ? webSdkLink.url() : null;
            } catch (Exception linkException) {
                log.warn("Created Sumsub applicant {} for user {} but failed to obtain WebSDK link",
                        applicantResponse.id(), request.userId(), linkException);
            }

            return new KycApplicantResponse(applicantResponse.id(), mapStatus(applicantResponse), reviewUrl);
        } catch (Exception exception) {
            log.error("Failed to create Sumsub applicant for user {}. Returning stub response.", request.userId(), exception);
            return buildStubResponse(externalUserId);
        }
    }

    private SumsubApplicantPayload buildApplicantPayload(CreateApplicantRequest request, String externalUserId) {
        NameParts parts = NameParts.from(request.fullName());
        return new SumsubApplicantPayload(
                externalUserId,
                request.email(),
                "individual",
                new SumsubApplicantPayload.ApplicantInfo(parts.firstName(), parts.lastName())
        );
    }

    private KycStatus mapStatus(SumsubApplicantResponse response) {
        String reviewStatus = response.review() != null ? response.review().reviewStatus() : null;
        String reviewAnswer = response.review() != null && response.review().reviewResult() != null
                ? response.review().reviewResult().reviewAnswer()
                : null;

        if (!StringUtils.hasText(reviewStatus)) {
            return KycStatus.PENDING;
        }

        return switch (reviewStatus.toLowerCase(Locale.US)) {
            case "pending" -> KycStatus.IN_REVIEW;
            case "completed" -> {
                if ("green".equalsIgnoreCase(reviewAnswer)) {
                    yield KycStatus.APPROVED;
                }
                if ("red".equalsIgnoreCase(reviewAnswer)) {
                    yield KycStatus.REJECTED;
                }
                yield KycStatus.IN_REVIEW;
            }
            case "onhold" -> KycStatus.RESUBMIT_REQUIRED;
            default -> KycStatus.PENDING;
        };
    }

    private KycApplicantResponse buildStubResponse(String externalUserId) {
        return new KycApplicantResponse(
                "stub-" + externalUserId,
                KycStatus.PENDING,
                properties.getStubReviewUrl()
        );
    }

    private record NameParts(String firstName, String lastName) {
        private static NameParts from(String fullName) {
            if (!StringUtils.hasText(fullName)) {
                throw new KycProviderException("Full name is required to create applicant");
            }
            String trimmed = fullName.trim();
            int separatorIndex = trimmed.indexOf(' ');
            if (separatorIndex < 0) {
                return new NameParts(trimmed, trimmed);
            }
            String first = trimmed.substring(0, separatorIndex).trim();
            String last = trimmed.substring(separatorIndex + 1).trim();
            if (!StringUtils.hasText(last)) {
                last = first;
            }
            return new NameParts(first, last);
        }
    }
}
