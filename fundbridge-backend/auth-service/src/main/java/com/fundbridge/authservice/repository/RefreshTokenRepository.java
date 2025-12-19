package com.fundbridge.authservice.repository;

import com.fundbridge.authservice.entity.RefreshToken;
import com.fundbridge.authservice.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findByUser(UserAccount user);

    void deleteByUserAndExpiresAtBefore(UserAccount user, Instant expiresAt);
}
