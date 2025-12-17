package com.fundbridge.walletservice.repository;

import com.fundbridge.walletservice.entity.WalletLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface WalletLedgerEntryRepository extends JpaRepository<WalletLedgerEntry, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<WalletLedgerEntry> findTopByAccount_IdOrderByCreatedAtDescIdDesc(Long accountId);
}
