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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "wallet_ledger_entries", indexes = {
        @Index(name = "idx_wle_tx", columnList = "tx_id"),
        @Index(name = "idx_wle_account_created", columnList = "account_id, created_at, id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_wle_tx_account_type", columnNames = {"tx_id", "account_id", "entry_type"})
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

    @Column(name = "prev_hash", length = 64)
    private String prevHash;

    @Column(name = "entry_hash", nullable = false, length = 64)
    private String entryHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

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

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getPrevHash() {
        return prevHash;
    }

    public void setPrevHash(String prevHash) {
        this.prevHash = prevHash;
    }

    public String getEntryHash() {
        return entryHash;
    }

    public void setEntryHash(String entryHash) {
        this.entryHash = entryHash;
    }
}
