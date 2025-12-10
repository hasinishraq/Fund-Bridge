package com.fundbridge.loanmanagementservice.service;

import com.fundbridge.loanmanagementservice.dto.CreditScoreResponse;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class CreditScoreService {

    /**
     * Simple, deterministic-ish credit score generator to keep the service self-contained for now.
     */
    public CreditScoreResponse getScoreForUser(Long userId) {
        int base = 580 + Math.toIntExact(Math.abs(userId != null ? userId % 200 : 0));
        int jitter = ThreadLocalRandom.current().nextInt(0, 40);
        int score = Math.min(base + jitter, 850);
        return new CreditScoreResponse(userId, score, grade(score), Instant.now());
    }

    private String grade(int score) {
        if (score >= 800) return "EXCELLENT";
        if (score >= 740) return "VERY_GOOD";
        if (score >= 670) return "GOOD";
        if (score >= 580) return "FAIR";
        return "POOR";
    }
}
