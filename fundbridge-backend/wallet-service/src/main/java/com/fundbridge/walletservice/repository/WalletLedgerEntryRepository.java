package com.fundbridge.walletservice.repository;

import com.fundbridge.walletservice.entity.WalletLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletLedgerEntryRepository extends JpaRepository<WalletLedgerEntry, Long> {
}
