package com.fundbridge.authservice.repository;

import com.fundbridge.authservice.entity.OtpCode;
import com.fundbridge.authservice.entity.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    Optional<OtpCode> findTopByEmailIgnoreCaseAndPurposeOrderByIdDesc(String email, OtpPurpose purpose);
}
