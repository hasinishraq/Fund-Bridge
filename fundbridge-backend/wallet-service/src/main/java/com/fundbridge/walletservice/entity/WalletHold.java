package com.fundbridge.walletservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wallet_holds", indexes = {
        @Index(name = "idx_wh_acc_status", columnList = "account_id,status"),
        @Index(name = "idx_wh_ref", columnList = "reference_type,reference_id"),
        @Index(name = "idx_wh_status_created", columnList = "status, created_at")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_wh_hold_ref", columnNames = "hold_ref"),
        @UniqueConstraint(name = "uq_wh_idem_scope", columnNames = {"account_id", "idempotency_hash"})
})
public class WalletHold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hold_ref", nullable = false, length = 36, updatable = false)
    private String holdRef;

    @Column(name = "idempotency_hash", length = 64)
    private String idempotencyHash;

    @ManyToOne
    @JoinColumn(name = "account_id", nullable = false)
    private WalletAccount account;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "BDT";

    @Column(nullable = false, length = 40)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private HoldStatus status = HoldStatus.ACTIVE;

    @Column(name = "reference_type", length = 20)
    private String referenceType;

    @Column(name = "reference_id", length = 64)
    private String referenceId;

    @ManyToOne
    @JoinColumn(name = "captured_tx_id")
    private WalletTransaction capturedTransaction;

    @ManyToOne
    @JoinColumn(name = "released_tx_id")
    private WalletTransaction releasedTransaction;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (this.holdRef == null) {
            this.holdRef = UUID.randomUUID().toString();
        }
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getHoldRef() {
        return holdRef;
    }

    public void setHoldRef(String holdRef) {
        this.holdRef = holdRef;
    }

    public String getIdempotencyHash() {
        return idempotencyHash;
    }

    public void setIdempotencyHash(String idempotencyHash) {
        this.idempotencyHash = idempotencyHash;
    }

    public WalletAccount getAccount() {
        return account;
    }

    public void setAccount(WalletAccount account) {
        this.account = account;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public HoldStatus getStatus() {
        return status;
    }

    public void setStatus(HoldStatus status) {
        this.status = status;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(String referenceType) {
        this.referenceType = referenceType;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }

    public WalletTransaction getCapturedTransaction() {
        return capturedTransaction;
    }

    public void setCapturedTransaction(WalletTransaction capturedTransaction) {
        this.capturedTransaction = capturedTransaction;
    }

    public WalletTransaction getReleasedTransaction() {
        return releasedTransaction;
    }

    public void setReleasedTransaction(WalletTransaction releasedTransaction) {
        this.releasedTransaction = releasedTransaction;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
