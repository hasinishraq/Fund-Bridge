package com.fundbridge.authservice.client.kyc;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "kyc-service", path = "/api/kyc")
public interface KycServiceClient {

    @PostMapping("/applicants")
    KycApplicantResponse createApplicant(@RequestBody CreateKycApplicantRequest request);
}
