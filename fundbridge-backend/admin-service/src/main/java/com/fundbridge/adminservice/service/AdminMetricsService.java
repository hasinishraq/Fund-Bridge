package com.fundbridge.adminservice.service;

import com.fundbridge.adminservice.config.LoanClientProperties;
import com.fundbridge.adminservice.config.WalletClientProperties;
import com.fundbridge.adminservice.dto.AdminKpiSnapshotResponse;
import com.fundbridge.adminservice.dto.LoanMetricsResponse;
import com.fundbridge.adminservice.dto.WalletMetricsResponse;
import com.fundbridge.adminservice.repository.AdminRiskEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

@Service
public class AdminMetricsService {

    private final RestTemplate restTemplate;
    private final WalletClientProperties walletProperties;
    private final LoanClientProperties loanProperties;
    private final AdminRiskEventRepository riskEventRepository;

    public AdminMetricsService(RestTemplate restTemplate,
                               WalletClientProperties walletProperties,
                               LoanClientProperties loanProperties,
                               AdminRiskEventRepository riskEventRepository) {
        this.restTemplate = restTemplate;
        this.walletProperties = walletProperties;
        this.loanProperties = loanProperties;
        this.riskEventRepository = riskEventRepository;
    }

    public AdminKpiSnapshotResponse buildLiveSnapshot() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        LoanMetricsResponse loanMetrics = fetchLoanMetrics(today);
        WalletMetricsResponse walletMetrics = fetchWalletMetrics(today);

        Integer suspiciousFlags = null;
        try {
            suspiciousFlags = Math.toIntExact(
                    riskEventRepository.countByStatusIgnoreCase("Suspicious activity")
            );
        } catch (Exception ignored) {
        }

        if (loanMetrics == null && walletMetrics == null && suspiciousFlags == null) {
            return null;
        }

        return new AdminKpiSnapshotResponse(
                null,
                loanMetrics != null ? loanMetrics.totalOutstandingLoans() : null,
                loanMetrics != null ? loanMetrics.todaysDisbursements() : null,
                loanMetrics != null ? loanMetrics.dueTodayAmount() : null,
                loanMetrics != null ? loanMetrics.overdueAmount() : null,
                loanMetrics != null ? loanMetrics.defaultRate30d() : null,
                walletMetrics != null ? walletMetrics.inflowToday() : null,
                walletMetrics != null ? walletMetrics.outflowToday() : null,
                walletMetrics != null ? safeLongToInt(walletMetrics.failedPaymentsCount()) : null,
                walletMetrics != null ? safeLongToInt(walletMetrics.webhookFailuresCount()) : null,
                suspiciousFlags,
                Instant.now()
        );
    }

    private LoanMetricsResponse fetchLoanMetrics(LocalDate date) {
        try {
            var uri = UriComponentsBuilder.fromHttpUrl(loanProperties.getBaseUrl())
                    .path("/loans/metrics")
                    .queryParam("date", date)
                    .build()
                    .toUri();
            return restTemplate.getForObject(uri, LoanMetricsResponse.class);
        } catch (RestClientException ex) {
            return null;
        }
    }

    private WalletMetricsResponse fetchWalletMetrics(LocalDate date) {
        try {
            var uri = UriComponentsBuilder.fromHttpUrl(walletProperties.getBaseUrl())
                    .path("/wallet/metrics")
                    .queryParam("date", date)
                    .build()
                    .toUri();
            return restTemplate.getForObject(uri, WalletMetricsResponse.class);
        } catch (RestClientException ex) {
            return null;
        }
    }

    private Integer safeLongToInt(long value) {
        if (value > Integer.MAX_VALUE) {
            return Integer.MAX_VALUE;
        }
        if (value < Integer.MIN_VALUE) {
            return Integer.MIN_VALUE;
        }
        return (int) value;
    }
}
