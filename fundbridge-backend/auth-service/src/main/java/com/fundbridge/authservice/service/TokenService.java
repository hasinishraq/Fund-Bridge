package com.fundbridge.authservice.service;

import com.fundbridge.authservice.dto.TokenPair;
import com.fundbridge.authservice.dto.TokenResult;
import com.fundbridge.authservice.entity.RefreshToken;
import com.fundbridge.authservice.entity.UserAccount;
import com.fundbridge.authservice.entity.UserStatus;
import com.fundbridge.authservice.exception.InvalidTokenException;
import com.fundbridge.authservice.repository.RefreshTokenRepository;
import com.fundbridge.authservice.security.JwtProperties;
import com.fundbridge.authservice.security.JwtService;
import com.fundbridge.authservice.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;

@Service
public class TokenService {

    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final RefreshTokenRepository refreshTokenRepository;
    private final HashService hashService;
    private final SecureRandom secureRandom = new SecureRandom();

    public TokenService(JwtService jwtService,
                        JwtProperties jwtProperties,
                        RefreshTokenRepository refreshTokenRepository,
                        HashService hashService) {
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.refreshTokenRepository = refreshTokenRepository;
        this.hashService = hashService;
    }

    @Transactional
    public TokenResult issueTokens(UserAccount user) {
        cleanExpired(user);
        String accessToken = jwtService.generateToken(UserPrincipal.from(user));
        String refreshToken = generateRefreshTokenValue();

        RefreshToken entity = new RefreshToken();
        entity.setUser(user);
        entity.setTokenHash(hashService.sha256(refreshToken));
        entity.setExpiresAt(Instant.now().plusSeconds(jwtProperties.refreshExpirationSeconds()));
        refreshTokenRepository.save(entity);

        return new TokenResult(new TokenPair(accessToken, refreshToken), user);
    }

    @Transactional
    public TokenResult refresh(String refreshTokenValue) {
        if (refreshTokenValue == null || refreshTokenValue.isBlank()) {
            throw new InvalidTokenException("Refresh token is required");
        }
        String hash = hashService.sha256(refreshTokenValue);
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidTokenException("Refresh token is invalid"));

        if (token.isRevoked()) {
            throw new InvalidTokenException("Refresh token has been revoked");
        }
        if (token.isExpired()) {
            throw new InvalidTokenException("Refresh token has expired");
        }

        UserAccount user = token.getUser();
        if (user == null) {
            throw new InvalidTokenException("Refresh token not linked to user");
        }
        if (!user.isEmailVerified() || user.getStatus() != UserStatus.ACTIVE) {
            throw new InvalidTokenException("User is not allowed to refresh session");
        }

        token.setRevokedAt(Instant.now());
        refreshTokenRepository.save(token);

        return issueTokens(user);
    }

    private String generateRefreshTokenValue() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return HexFormat.of().formatHex(randomBytes);
    }

    private void cleanExpired(UserAccount user) {
        refreshTokenRepository.deleteByUserAndExpiresAtBefore(user, Instant.now());
    }
}
