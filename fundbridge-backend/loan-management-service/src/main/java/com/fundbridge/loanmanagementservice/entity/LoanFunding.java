package com.fundbridge.loanmanagementservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "loan_fundings",
        uniqueConstraints = @UniqueConstraint(name = "uq_lf_idempotency", columnNames = "idempotency_key"),
        indexes = {
                @Index(name = "idx_lf_loan", columnList = "loan_id"),
                @Index(name = "idx_lf_lender", columnList = "lender_user_id"),
                @Index(name = "idx_lf_loan_status", columnList = "loan_id,status")
        })
public class LoanFunding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_id", nullable = false, foreignKey = @ForeignKey(name = "fk_lf_loan"))
    private Loan loan;

    @Column(name = "lender_user_id", nullable = false)
    private Long lenderUserId;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LoanFundingStatus status = LoanFundingStatus.PLEDGED;

    @Column(name = "idempotency_key", nullable = false, length = 80)
    private String idempotencyKey;

    @Column(name = "wallet_tx_ref", length = 64)
    private String walletTxRef;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "captured_at")
    private Instant capturedAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Loan getLoan() {
        return loan;
    }

    public void setLoan(Loan loan) {
        this.loan = loan;
    }

    public Long getLenderUserId() {
        return lenderUserId;
    }

    public void setLenderUserId(Long lenderUserId) {
        this.lenderUserId = lenderUserId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LoanFundingStatus getStatus() {
        return status;
    }

    public void setStatus(LoanFundingStatus status) {
        this.status = status;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getWalletTxRef() {
        return walletTxRef;
    }

    public void setWalletTxRef(String walletTxRef) {
        this.walletTxRef = walletTxRef;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getCapturedAt() {
        return capturedAt;
    }

    public void setCapturedAt(Instant capturedAt) {
        this.capturedAt = capturedAt;
    }
}
