package com.fundbridge.walletservice.repository;

import com.fundbridge.walletservice.entity.EntryType;
import com.fundbridge.walletservice.entity.WalletLedgerEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

public interface WalletLedgerEntryRepository extends JpaRepository<WalletLedgerEntry, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<WalletLedgerEntry> findTopByAccount_IdOrderByCreatedAtDescIdDesc(Long accountId);

    @Query("""
        select coalesce(sum(e.amount), 0)
        from WalletLedgerEntry e
        where e.entryType = :entryType
          and e.createdAt >= :from
          and e.createdAt < :to
        """)
    BigDecimal sumByEntryTypeAndCreatedAtBetween(EntryType entryType, Instant from, Instant to);

    @Query("""
        select coalesce(sum(e.amount), 0)
        from WalletLedgerEntry e
        where e.entryType = :entryType
          and e.currency = :currency
          and e.createdAt >= :from
          and e.createdAt < :to
        """)
    BigDecimal sumByEntryTypeAndCurrencyAndCreatedAtBetween(EntryType entryType,
                                                           String currency,
                                                           Instant from,
                                                           Instant to);
}
