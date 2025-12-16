package com.fundbridge.walletservice.service;

import com.fundbridge.walletservice.config.WalletProperties;
import com.fundbridge.walletservice.dto.CaptureHoldRequest;
import com.fundbridge.walletservice.dto.CreateHoldRequest;
import com.fundbridge.walletservice.dto.CreateWalletRequest;
import com.fundbridge.walletservice.dto.ReleaseHoldRequest;
import com.fundbridge.walletservice.dto.TransferRequest;
import com.fundbridge.walletservice.dto.WalletHoldResponse;
import com.fundbridge.walletservice.dto.WalletSummaryResponse;
import com.fundbridge.walletservice.dto.WalletTopUpRequest;
import com.fundbridge.walletservice.dto.WalletTransactionResponse;
import com.fundbridge.walletservice.entity.EntryType;
import com.fundbridge.walletservice.entity.HoldStatus;
import com.fundbridge.walletservice.entity.TransactionStatus;
import com.fundbridge.walletservice.entity.TransactionType;
import com.fundbridge.walletservice.entity.WalletAccount;
import com.fundbridge.walletservice.entity.WalletBalance;
import com.fundbridge.walletservice.entity.WalletHold;
import com.fundbridge.walletservice.entity.WalletLedgerEntry;
import com.fundbridge.walletservice.entity.WalletStatus;
import com.fundbridge.walletservice.entity.WalletTransaction;
import com.fundbridge.walletservice.exception.InsufficientFundsException;
import com.fundbridge.walletservice.exception.ResourceConflictException;
import com.fundbridge.walletservice.exception.ResourceNotFoundException;
import com.fundbridge.walletservice.repository.WalletAccountRepository;
import com.fundbridge.walletservice.repository.WalletBalanceRepository;
import com.fundbridge.walletservice.repository.WalletHoldRepository;
import com.fundbridge.walletservice.repository.WalletLedgerEntryRepository;
import com.fundbridge.walletservice.repository.WalletTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class WalletService {

    private static final int IDEMPOTENCY_MAX_LENGTH = 80;

    private final WalletAccountRepository accountRepository;
    private final WalletBalanceRepository balanceRepository;
    private final WalletTransactionRepository transactionRepository;
    private final WalletLedgerEntryRepository ledgerEntryRepository;
    private final WalletHoldRepository holdRepository;
    private final WalletProperties walletProperties;

    public WalletService(WalletAccountRepository accountRepository,
                         WalletBalanceRepository balanceRepository,
                         WalletTransactionRepository transactionRepository,
                         WalletLedgerEntryRepository ledgerEntryRepository,
                         WalletHoldRepository holdRepository,
                         WalletProperties walletProperties) {
        this.accountRepository = accountRepository;
        this.balanceRepository = balanceRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.holdRepository = holdRepository;
        this.walletProperties = walletProperties;
    }

    @Transactional
    public WalletSummaryResponse createWallet(CreateWalletRequest request) {
        Long userId = resolveUserId(request.userId());
        String currency = normalizeCurrency(request.currency());
        WalletAccount account = getOrCreateAccount(userId, currency, false);
        WalletBalance balance = getOrCreateBalance(account, false);
        return toSummary(account, balance);
    }

    @Transactional
    public WalletSummaryResponse getWallet(Long userId, String currency) {
        Long resolvedUser = resolveUserId(userId);
        String resolvedCurrency = normalizeCurrency(currency);
        WalletAccount account = getOrCreateAccount(resolvedUser, resolvedCurrency, false);
        WalletBalance balance = getOrCreateBalance(account, false);
        return toSummary(account, balance);
    }

    @Transactional
    public WalletSummaryResponse topUp(WalletTopUpRequest request) {
        Long userId = resolveUserId(request.userId());
        String currency = normalizeCurrency(request.currency());
        BigDecimal amount = normalizeAmount(request.amount());
        WalletAccount account = getOrCreateAccount(userId, currency, true);
        WalletBalance balance = getOrCreateBalance(account, true);

        String idempotencyKey = normalizeIdempotencyKey(request.idempotencyKey());
        Optional<WalletTransaction> existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            WalletTransaction tx = existing.get();
            if (tx.getStatus() == TransactionStatus.POSTED) {
                return toSummary(account, balance);
            }
            throw new ResourceConflictException("Transaction already exists with status " + tx.getStatus());
        }

        WalletTransaction transaction = new WalletTransaction();
        transaction.setIdempotencyKey(idempotencyKey);
        transaction.setType(TransactionType.FUNDING);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setToAccount(account);
        transaction.setAmount(amount);
        transaction.setCurrency(currency);
        transaction.setReferenceType(request.referenceType());
        transaction.setReferenceId(request.referenceId());
        transactionRepository.save(transaction);

        WalletLedgerEntry credit = new WalletLedgerEntry();
        credit.setTransaction(transaction);
        credit.setAccount(account);
        credit.setEntryType(EntryType.CREDIT);
        credit.setAmount(amount);
        credit.setCurrency(currency);
        ledgerEntryRepository.save(credit);
        transaction.getLedgerEntries().add(credit);

        balance.setAvailable(balance.getAvailable().add(amount));
        balanceRepository.save(balance);

        transaction.setStatus(TransactionStatus.POSTED);
        transaction.setPostedAt(Instant.now());
        transactionRepository.save(transaction);

        return toSummary(account, balance);
    }

    @Transactional
    public WalletTransactionResponse transfer(TransferRequest request) {
        BigDecimal amount = normalizeAmount(request.amount());
        String currency = normalizeCurrencyOrNull(request.currency());
        String idempotencyKey = normalizeIdempotencyKey(request.idempotencyKey());

        Optional<WalletTransaction> existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            WalletTransaction tx = existing.get();
            if (tx.getStatus() == TransactionStatus.POSTED) {
                return toTransaction(tx);
            }
            throw new ResourceConflictException("Transaction already exists with status " + tx.getStatus());
        }

        WalletAccount fromAccount = accountRepository.findByIdForUpdate(request.fromAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Source wallet not found"));
        WalletAccount toAccount = accountRepository.findByIdForUpdate(request.toAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination wallet not found"));

        if (!fromAccount.getCurrency().equalsIgnoreCase(toAccount.getCurrency())) {
            throw new ResourceConflictException("Currency mismatch between wallets");
        }
        if (currency != null && !currency.equalsIgnoreCase(fromAccount.getCurrency())) {
            throw new ResourceConflictException("Currency mismatch for transfer");
        }
        String effectiveCurrency = fromAccount.getCurrency();

        WalletBalance fromBalance = getOrCreateBalance(fromAccount, true);
        WalletBalance toBalance = getOrCreateBalance(toAccount, true);

        if (fromBalance.getAvailable().compareTo(amount) < 0) {
            throw new InsufficientFundsException(amount, fromBalance.getAvailable());
        }

        WalletTransaction transaction = new WalletTransaction();
        transaction.setIdempotencyKey(idempotencyKey);
        transaction.setType(TransactionType.P2P_TRANSFER);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setFromAccount(fromAccount);
        transaction.setToAccount(toAccount);
        transaction.setAmount(amount);
        transaction.setCurrency(effectiveCurrency);
        transaction.setReferenceType(request.referenceType());
        transaction.setReferenceId(request.referenceId());
        transactionRepository.save(transaction);

        WalletLedgerEntry debit = new WalletLedgerEntry();
        debit.setTransaction(transaction);
        debit.setAccount(fromAccount);
        debit.setEntryType(EntryType.DEBIT);
        debit.setAmount(amount);
        debit.setCurrency(effectiveCurrency);
        ledgerEntryRepository.save(debit);
        transaction.getLedgerEntries().add(debit);

        WalletLedgerEntry credit = new WalletLedgerEntry();
        credit.setTransaction(transaction);
        credit.setAccount(toAccount);
        credit.setEntryType(EntryType.CREDIT);
        credit.setAmount(amount);
        credit.setCurrency(effectiveCurrency);
        ledgerEntryRepository.save(credit);
        transaction.getLedgerEntries().add(credit);

        fromBalance.setAvailable(fromBalance.getAvailable().subtract(amount));
        toBalance.setAvailable(toBalance.getAvailable().add(amount));
        balanceRepository.save(fromBalance);
        balanceRepository.save(toBalance);

        transaction.setStatus(TransactionStatus.POSTED);
        transaction.setPostedAt(Instant.now());
        transactionRepository.save(transaction);

        return toTransaction(transaction);
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionResponse> listTransactions(Long userId, String currency) {
        Long resolvedUser = resolveUserId(userId);
        String resolvedCurrency = normalizeCurrency(currency);
        Optional<WalletAccount> accountOpt = accountRepository.findByUserIdAndCurrency(resolvedUser, resolvedCurrency);
        if (accountOpt.isEmpty()) {
            return List.of();
        }
        WalletAccount account = accountOpt.get();
        return transactionRepository.findByFromAccount_IdOrToAccount_IdOrderByCreatedAtDesc(account.getId(), account.getId())
                .stream()
                .map(this::toTransaction)
                .toList();
    }

    @Transactional
    public WalletHoldResponse createHold(CreateHoldRequest request) {
        WalletAccount account = accountRepository.findByIdForUpdate(request.accountId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for hold"));
        String currency = normalizeCurrencyOrNull(request.currency());
        if (currency != null && !currency.equalsIgnoreCase(account.getCurrency())) {
            throw new ResourceConflictException("Currency mismatch for hold");
        }
        BigDecimal amount = normalizeAmount(request.amount());
        WalletBalance balance = getOrCreateBalance(account, true);
        if (balance.getAvailable().compareTo(amount) < 0) {
            throw new InsufficientFundsException(amount, balance.getAvailable());
        }

        balance.setAvailable(balance.getAvailable().subtract(amount));
        balance.setHeld(balance.getHeld().add(amount));
        balanceRepository.save(balance);

        WalletHold hold = new WalletHold();
        hold.setAccount(account);
        hold.setAmount(amount);
        hold.setCurrency(account.getCurrency());
        hold.setReason(request.reason());
        hold.setReferenceType(request.referenceType());
        hold.setReferenceId(request.referenceId());
        holdRepository.save(hold);
        return toHold(hold);
    }

    @Transactional
    public WalletHoldResponse releaseHold(Long holdId, ReleaseHoldRequest request) {
        WalletHold hold = holdRepository.findByIdForUpdate(holdId)
                .orElseThrow(() -> new ResourceNotFoundException("Hold not found"));
        if (hold.getStatus() != HoldStatus.ACTIVE) {
            throw new ResourceConflictException("Hold is not active");
        }

        WalletBalance balance = getOrCreateBalance(hold.getAccount(), true);
        balance.setHeld(balance.getHeld().subtract(hold.getAmount()));
        balance.setAvailable(balance.getAvailable().add(hold.getAmount()));
        balanceRepository.save(balance);

        hold.setStatus(HoldStatus.RELEASED);
        hold.setReason(request.reason() != null ? request.reason() : hold.getReason());
        holdRepository.save(hold);
        return toHold(hold);
    }

    @Transactional
    public WalletTransactionResponse captureHold(Long holdId, CaptureHoldRequest request) {
        WalletHold hold = holdRepository.findByIdForUpdate(holdId)
                .orElseThrow(() -> new ResourceNotFoundException("Hold not found"));
        if (hold.getStatus() != HoldStatus.ACTIVE) {
            throw new ResourceConflictException("Hold is not active");
        }

        WalletBalance balance = getOrCreateBalance(hold.getAccount(), true);
        balance.setHeld(balance.getHeld().subtract(hold.getAmount()));
        balanceRepository.save(balance);

        String idempotencyKey = normalizeIdempotencyKey(request.idempotencyKey());
        Optional<WalletTransaction> existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            WalletTransaction tx = existing.get();
            if (tx.getStatus() == TransactionStatus.POSTED) {
                hold.setStatus(HoldStatus.CAPTURED);
                holdRepository.save(hold);
                return toTransaction(tx);
            }
            throw new ResourceConflictException("Transaction already exists with status " + tx.getStatus());
        }

        WalletTransaction transaction = new WalletTransaction();
        transaction.setIdempotencyKey(idempotencyKey);
        transaction.setType(request.transactionType() != null ? request.transactionType() : TransactionType.EMI_REPAY);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setFromAccount(hold.getAccount());
        transaction.setAmount(hold.getAmount());
        transaction.setCurrency(hold.getCurrency());
        transaction.setReferenceType(request.referenceType());
        transaction.setReferenceId(request.referenceId());
        transactionRepository.save(transaction);

        WalletLedgerEntry debit = new WalletLedgerEntry();
        debit.setTransaction(transaction);
        debit.setAccount(hold.getAccount());
        debit.setEntryType(EntryType.DEBIT);
        debit.setAmount(hold.getAmount());
        debit.setCurrency(hold.getCurrency());
        ledgerEntryRepository.save(debit);
        transaction.getLedgerEntries().add(debit);

        transaction.setStatus(TransactionStatus.POSTED);
        transaction.setPostedAt(Instant.now());
        transactionRepository.save(transaction);

        hold.setStatus(HoldStatus.CAPTURED);
        holdRepository.save(hold);
        return toTransaction(transaction);
    }

    private WalletAccount getOrCreateAccount(Long userId, String currency, boolean lock) {
        Optional<WalletAccount> existing = lock
                ? accountRepository.findByUserIdAndCurrencyForUpdate(userId, currency)
                : accountRepository.findByUserIdAndCurrency(userId, currency);
        if (existing.isPresent()) {
            return existing.get();
        }
        WalletAccount account = new WalletAccount();
        account.setUserId(userId);
        account.setCurrency(currency);
        account.setStatus(WalletStatus.ACTIVE);
        return accountRepository.save(account);
    }

    private WalletBalance getOrCreateBalance(WalletAccount account, boolean lock) {
        Optional<WalletBalance> existing = lock
                ? balanceRepository.findByAccountIdForUpdate(account.getId())
                : balanceRepository.findById(account.getId());
        if (existing.isPresent()) {
            WalletBalance balance = existing.get();
            if (balance.getAvailable() == null) {
                balance.setAvailable(BigDecimal.ZERO);
            }
            if (balance.getHeld() == null) {
                balance.setHeld(BigDecimal.ZERO);
            }
            return balance;
        }
        WalletBalance balance = new WalletBalance();
        balance.setAccount(account);
        balance.setAvailable(BigDecimal.ZERO);
        balance.setHeld(BigDecimal.ZERO);
        return balanceRepository.save(balance);
    }

    private WalletSummaryResponse toSummary(WalletAccount account, WalletBalance balance) {
        return new WalletSummaryResponse(
                account.getId(),
                account.getUserId(),
                account.getCurrency(),
                balance.getAvailable(),
                balance.getHeld(),
                account.getStatus(),
                balance.getUpdatedAt()
        );
    }

    private WalletTransactionResponse toTransaction(WalletTransaction transaction) {
        return new WalletTransactionResponse(
                transaction.getId(),
                transaction.getIdempotencyKey(),
                transaction.getType(),
                transaction.getStatus(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getFromAccount() != null ? transaction.getFromAccount().getId() : null,
                transaction.getToAccount() != null ? transaction.getToAccount().getId() : null,
                transaction.getReferenceType(),
                transaction.getReferenceId(),
                transaction.getFailureReason(),
                transaction.getCreatedAt(),
                transaction.getPostedAt()
        );
    }

    private WalletHoldResponse toHold(WalletHold hold) {
        return new WalletHoldResponse(
                hold.getId(),
                hold.getAccount().getId(),
                hold.getAmount(),
                hold.getCurrency(),
                hold.getReason(),
                hold.getStatus(),
                hold.getReferenceType(),
                hold.getReferenceId(),
                hold.getCreatedAt(),
                hold.getUpdatedAt()
        );
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            return BigDecimal.ZERO;
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeCurrency(String currency) {
        String fallback = walletProperties.getDefaultCurrency();
        if (currency == null || currency.isBlank()) {
            return fallback != null ? fallback.toUpperCase() : "BDT";
        }
        return currency.trim().toUpperCase();
    }

    private String normalizeCurrencyOrNull(String currency) {
        if (currency == null || currency.isBlank()) {
            return null;
        }
        return currency.trim().toUpperCase();
    }

    private Long resolveUserId(Long userId) {
        if (userId != null) {
            return userId;
        }
        return walletProperties.getDemoUserId();
    }

    private String normalizeIdempotencyKey(String key) {
        String value = (key == null || key.isBlank()) ? UUID.randomUUID().toString() : key.trim();
        if (value.length() > IDEMPOTENCY_MAX_LENGTH) {
            return value.substring(0, IDEMPOTENCY_MAX_LENGTH);
        }
        return value;
    }
}
