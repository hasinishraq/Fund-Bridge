package com.fundbridge.walletservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Index;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "wallet_ledger_entries", indexes = {
        @Index(name = "idx_wle_tx", columnList = "tx_id"),
        @Index(name = "idx_wle_account", columnList = "account_id")
})
public class WalletLedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tx_id", nullable = false)
    private WalletTransaction transaction;

    @ManyToOne
    @JoinColumn(name = "account_id", nullable = false)
    private WalletAccount account;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 10)
    private EntryType entryType;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "BDT";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public WalletTransaction getTransaction() {
        return transaction;
    }

    public void setTransaction(WalletTransaction transaction) {
        this.transaction = transaction;
    }

    public WalletAccount getAccount() {
        return account;
    }

    public void setAccount(WalletAccount account) {
        this.account = account;
    }

    public EntryType getEntryType() {
        return entryType;
    }

    public void setEntryType(EntryType entryType) {
        this.entryType = entryType;
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

    public Instant getCreatedAt() {
        return createdAt;
    }
}
