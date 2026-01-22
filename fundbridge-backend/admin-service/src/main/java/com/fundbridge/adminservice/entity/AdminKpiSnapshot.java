package com.fundbridge.adminservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "admin_kpi_snapshots", indexes = {
        @Index(name = "idx_kpi_created", columnList = "created_at")
})
public class AdminKpiSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "total_outstanding_loans", precision = 19, scale = 2, nullable = false)
    private BigDecimal totalOutstandingLoans;

    @Column(name = "todays_disbursements", precision = 19, scale = 2, nullable = false)
    private BigDecimal todaysDisbursements;

    @Column(name = "due_today_amount", precision = 19, scale = 2, nullable = false)
    private BigDecimal dueTodayAmount;

    @Column(name = "overdue_amount", precision = 19, scale = 2, nullable = false)
    private BigDecimal overdueAmount;

    @Column(name = "default_rate_30d", precision = 6, scale = 3, nullable = false)
    private BigDecimal defaultRate30d;

    @Column(name = "wallet_inflow_today", precision = 19, scale = 2, nullable = false)
    private BigDecimal walletInflowToday;

    @Column(name = "wallet_outflow_today", precision = 19, scale = 2, nullable = false)
    private BigDecimal walletOutflowToday;

    @Column(name = "failed_payments_count", nullable = false)
    private Integer failedPaymentsCount;

    @Column(name = "webhook_failures_count", nullable = false)
    private Integer webhookFailuresCount;

    @Column(name = "suspicious_activity_flags", nullable = false)
    private Integer suspiciousActivityFlags;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public BigDecimal getTotalOutstandingLoans() {
        return totalOutstandingLoans;
    }

    public void setTotalOutstandingLoans(BigDecimal totalOutstandingLoans) {
        this.totalOutstandingLoans = totalOutstandingLoans;
    }

    public BigDecimal getTodaysDisbursements() {
        return todaysDisbursements;
    }

    public void setTodaysDisbursements(BigDecimal todaysDisbursements) {
        this.todaysDisbursements = todaysDisbursements;
    }

    public BigDecimal getDueTodayAmount() {
        return dueTodayAmount;
    }

    public void setDueTodayAmount(BigDecimal dueTodayAmount) {
        this.dueTodayAmount = dueTodayAmount;
    }

    public BigDecimal getOverdueAmount() {
        return overdueAmount;
    }

    public void setOverdueAmount(BigDecimal overdueAmount) {
        this.overdueAmount = overdueAmount;
    }

    public BigDecimal getDefaultRate30d() {
        return defaultRate30d;
    }

    public void setDefaultRate30d(BigDecimal defaultRate30d) {
        this.defaultRate30d = defaultRate30d;
    }

    public BigDecimal getWalletInflowToday() {
        return walletInflowToday;
    }

    public void setWalletInflowToday(BigDecimal walletInflowToday) {
        this.walletInflowToday = walletInflowToday;
    }

    public BigDecimal getWalletOutflowToday() {
        return walletOutflowToday;
    }

    public void setWalletOutflowToday(BigDecimal walletOutflowToday) {
        this.walletOutflowToday = walletOutflowToday;
    }

    public Integer getFailedPaymentsCount() {
        return failedPaymentsCount;
    }

    public void setFailedPaymentsCount(Integer failedPaymentsCount) {
        this.failedPaymentsCount = failedPaymentsCount;
    }

    public Integer getWebhookFailuresCount() {
        return webhookFailuresCount;
    }

    public void setWebhookFailuresCount(Integer webhookFailuresCount) {
        this.webhookFailuresCount = webhookFailuresCount;
    }

    public Integer getSuspiciousActivityFlags() {
        return suspiciousActivityFlags;
    }

    public void setSuspiciousActivityFlags(Integer suspiciousActivityFlags) {
        this.suspiciousActivityFlags = suspiciousActivityFlags;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
