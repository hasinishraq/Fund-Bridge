package com.fundbridge.walletservice.service;

import com.fundbridge.walletservice.dto.WalletMetricsResponse;
import com.fundbridge.walletservice.entity.EntryType;
import com.fundbridge.walletservice.entity.TransactionStatus;
import com.fundbridge.walletservice.repository.WalletLedgerEntryRepository;
import com.fundbridge.walletservice.repository.WalletTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

@Service
@Transactional(readOnly = true)
public class WalletMetricsService {

    private final WalletLedgerEntryRepository ledgerEntryRepository;
    private final WalletTransactionRepository transactionRepository;

    public WalletMetricsService(WalletLedgerEntryRepository ledgerEntryRepository,
                                WalletTransactionRepository transactionRepository) {
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.transactionRepository = transactionRepository;
    }

    public WalletMetricsResponse getMetrics(LocalDate date, String currency) {
        LocalDate target = date != null ? date : LocalDate.now(ZoneOffset.UTC);
        Instant from = target.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to = target.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        BigDecimal inflow;
        BigDecimal outflow;
        if (currency == null || currency.isBlank()) {
            inflow = ledgerEntryRepository.sumByEntryTypeAndCreatedAtBetween(EntryType.CREDIT, from, to);
            outflow = ledgerEntryRepository.sumByEntryTypeAndCreatedAtBetween(EntryType.DEBIT, from, to);
        } else {
            String normalizedCurrency = currency.trim().toUpperCase();
            inflow = ledgerEntryRepository.sumByEntryTypeAndCurrencyAndCreatedAtBetween(
                    EntryType.CREDIT,
                    normalizedCurrency,
                    from,
                    to
            );
            outflow = ledgerEntryRepository.sumByEntryTypeAndCurrencyAndCreatedAtBetween(
                    EntryType.DEBIT,
                    normalizedCurrency,
                    from,
                    to
            );
            currency = normalizedCurrency;
        }

        long failedCount = transactionRepository.countByStatusAndCreatedAtBetween(
                TransactionStatus.FAILED,
                from,
                to
        );
        long webhookFailures = transactionRepository.countByStatusAndReferenceTypeContaining(
                TransactionStatus.FAILED,
                from,
                to,
                "webhook"
        );

        return new WalletMetricsResponse(
                inflow,
                outflow,
                failedCount,
                webhookFailures,
                currency,
                from,
                to
        );
    }
}
