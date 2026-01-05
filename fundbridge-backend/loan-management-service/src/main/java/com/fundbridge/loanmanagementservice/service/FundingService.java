package com.fundbridge.loanmanagementservice.service;

import com.fundbridge.loanmanagementservice.config.LoanProperties;
import com.fundbridge.loanmanagementservice.dto.CreateFundingRequest;
import com.fundbridge.loanmanagementservice.dto.FundingActionRequest;
import com.fundbridge.loanmanagementservice.dto.FundingResponse;
import com.fundbridge.loanmanagementservice.entity.Loan;
import com.fundbridge.loanmanagementservice.entity.LoanEventType;
import com.fundbridge.loanmanagementservice.entity.LoanFunding;
import com.fundbridge.loanmanagementservice.entity.LoanFundingStatus;
import com.fundbridge.loanmanagementservice.entity.LoanStatus;
import com.fundbridge.loanmanagementservice.exception.BadRequestException;
import com.fundbridge.loanmanagementservice.exception.ResourceConflictException;
import com.fundbridge.loanmanagementservice.exception.ResourceNotFoundException;
import com.fundbridge.loanmanagementservice.integration.wallet.WalletClient;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.CaptureHoldRequest;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.CreateHoldRequest;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.ReleaseHoldRequest;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.WalletHoldResponse;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.WalletSummaryResponse;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.WalletTransactionResponse;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.WalletTransactionType;
import com.fundbridge.loanmanagementservice.repository.LoanFundingRepository;
import com.fundbridge.loanmanagementservice.repository.LoanRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class FundingService {

    private static final Logger log = LoggerFactory.getLogger(FundingService.class);
    private static final String HOLD_REASON = "LOAN_FUNDING_HOLD";
    private static final String REFERENCE_TYPE = "LOAN_FUNDING";

    private final LoanFundingRepository fundingRepository;
    private final LoanRepository loanRepository;
    private final LoanEventService loanEventService;
    private final LoanProperties loanProperties;
    private final WalletClient walletClient;

    public FundingService(LoanFundingRepository fundingRepository,
                          LoanRepository loanRepository,
                          LoanEventService loanEventService,
                          LoanProperties loanProperties,
                          WalletClient walletClient) {
        this.fundingRepository = fundingRepository;
        this.loanRepository = loanRepository;
        this.loanEventService = loanEventService;
        this.loanProperties = loanProperties;
        this.walletClient = walletClient;
    }

    @Transactional
    public FundingResponse createFunding(CreateFundingRequest request) {
        Loan loan = loanRepository.findById(request.loanId())
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        if (loan.getStatus() == LoanStatus.REJECTED || loan.getStatus() == LoanStatus.DEFAULTED
                || loan.getStatus() == LoanStatus.CLOSED) {
            throw new ResourceConflictException("Cannot fund a closed or rejected loan");
        }

        String idempotencyKey = normalizeIdempotencyKey(request.idempotencyKey());
        Optional<LoanFunding> existing = fundingRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        Long lenderId = resolveLenderId(request.lenderId());
        BigDecimal amount = normalizeAmount(request.amount());
        WalletHoldResponse hold = createFundingHold(loan, lenderId, amount, idempotencyKey);

        LoanFunding funding = new LoanFunding();
        funding.setLoan(loan);
        funding.setLenderUserId(lenderId);
        funding.setAmount(amount);
        funding.setStatus(LoanFundingStatus.PLEDGED);
        funding.setIdempotencyKey(idempotencyKey);
        funding.setWalletTxRef(hold != null && hold.holdId() != null ? String.valueOf(hold.holdId()) : null);
        try {
            fundingRepository.save(funding);
        } catch (RuntimeException ex) {
            safeReleaseHold(hold);
            throw ex;
        }
        if (loan.getStatus() == LoanStatus.REQUESTED || loan.getStatus() == LoanStatus.APPROVED) {
            loan.setStatus(LoanStatus.FUNDING);
            loanRepository.save(loan);
        }
        return toResponse(funding);
    }

    @Transactional
    public FundingResponse captureFunding(Long fundingId, FundingActionRequest request) {
        LoanFunding funding = fundingRepository.findById(fundingId)
                .orElseThrow(() -> new ResourceNotFoundException("Funding not found"));
        if (funding.getStatus() == LoanFundingStatus.CANCELED) {
            throw new ResourceConflictException("Funding pledge already canceled");
        }
        if (funding.getStatus() == LoanFundingStatus.CAPTURED) {
            return toResponse(funding);
        }
        Long holdId = resolveHoldId(funding.getWalletTxRef(), request);
        WalletTransactionResponse captureTx = null;
        if (holdId != null) {
            CaptureHoldRequest captureRequest = new CaptureHoldRequest(
                    WalletTransactionType.FUNDING,
                    REFERENCE_TYPE,
                    funding.getLoan() != null ? String.valueOf(funding.getLoan().getId()) : null,
                    buildCaptureIdempotencyKey(funding),
                    null
            );
            captureTx = walletClient.captureHold(holdId, captureRequest);
        }
        funding.setStatus(LoanFundingStatus.CAPTURED);
        funding.setCapturedAt(Instant.now());
        if (captureTx != null && captureTx.txRef() != null) {
            funding.setWalletTxRef(captureTx.txRef());
        } else if (request != null && request.walletTxRef() != null) {
            funding.setWalletTxRef(request.walletTxRef());
        }
        fundingRepository.save(funding);
        maybeMarkLoanFunded(funding.getLoan());
        return toResponse(funding);
    }

    @Transactional
    public FundingResponse cancelFunding(Long fundingId, FundingActionRequest request) {
        LoanFunding funding = fundingRepository.findById(fundingId)
                .orElseThrow(() -> new ResourceNotFoundException("Funding not found"));
        if (funding.getStatus() == LoanFundingStatus.CAPTURED) {
            throw new ResourceConflictException("Captured funding cannot be canceled");
        }
        Long holdId = resolveHoldId(funding.getWalletTxRef(), request);
        if (holdId != null) {
            walletClient.releaseHold(holdId, new ReleaseHoldRequest("Funding canceled"));
        }
        funding.setStatus(LoanFundingStatus.CANCELED);
        if (request != null && request.walletTxRef() != null && holdId == null) {
            funding.setWalletTxRef(request.walletTxRef());
        }
        fundingRepository.save(funding);
        return toResponse(funding);
    }

    @Transactional(readOnly = true)
    public List<FundingResponse> listFundingsForLoan(Long loanId) {
        return fundingRepository.findByLoan_Id(loanId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FundingResponse> listFundingsForLender(Long lenderId) {
        Long resolved = resolveLenderId(lenderId);
        return fundingRepository.findByLenderUserIdOrderByCreatedAtDesc(resolved)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void maybeMarkLoanFunded(Loan loan) {
        if (loan == null) {
            return;
        }
        BigDecimal totalCaptured = fundingRepository.findByLoan_Id(loan.getId())
                .stream()
                .filter(f -> f.getStatus() == LoanFundingStatus.CAPTURED)
                .map(LoanFunding::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalCaptured.compareTo(loan.getAmount()) >= 0 && loan.getStatus() != LoanStatus.FUNDED) {
            loan.setStatus(LoanStatus.FUNDED);
            loan.setActivatedAt(Instant.now());
            loanRepository.save(loan);
            loanEventService.record(loan, LoanEventType.FUNDED, null,
                    "Loan fully funded with total " + totalCaptured);
        } else if (totalCaptured.compareTo(BigDecimal.ZERO) > 0
                && loan.getStatus() != LoanStatus.FUNDED
                && loan.getStatus() != LoanStatus.ACTIVE
                && loan.getStatus() != LoanStatus.FUNDING) {
            loan.setStatus(LoanStatus.FUNDING);
            loanRepository.save(loan);
        }
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            throw new BadRequestException("Amount is required");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private WalletHoldResponse createFundingHold(Loan loan,
                                                 Long lenderId,
                                                 BigDecimal amount,
                                                 String idempotencyKey) {
        String currency = resolveCurrency(loan);
        WalletSummaryResponse wallet = walletClient.getWallet(lenderId, currency);
        if (wallet == null || wallet.accountId() == null) {
            throw new ResourceConflictException("Wallet account unavailable for funding hold");
        }
        CreateHoldRequest holdRequest = new CreateHoldRequest(
                wallet.accountId(),
                amount,
                currency,
                HOLD_REASON,
                REFERENCE_TYPE,
                loan != null ? String.valueOf(loan.getId()) : null,
                idempotencyKey
        );
        WalletHoldResponse hold = walletClient.createHold(holdRequest);
        if (hold == null || hold.holdId() == null) {
            throw new BadRequestException("Wallet hold was not created");
        }
        return hold;
    }

    private void safeReleaseHold(WalletHoldResponse hold) {
        if (hold == null || hold.holdId() == null) {
            return;
        }
        try {
            walletClient.releaseHold(hold.holdId(), new ReleaseHoldRequest("Funding creation failed"));
        } catch (Exception ex) {
            log.warn("Failed to release wallet hold {}", hold.holdId(), ex);
        }
    }

    private String normalizeIdempotencyKey(String key) {
        String value = (key == null || key.isBlank()) ? UUID.randomUUID().toString() : key.trim();
        if (value.length() > 80) {
            return value.substring(0, 80);
        }
        return value;
    }

    private String buildCaptureIdempotencyKey(LoanFunding funding) {
        String base = funding != null ? funding.getIdempotencyKey() : null;
        if (base == null || base.isBlank()) {
            base = UUID.randomUUID().toString();
        }
        return normalizeIdempotencyKey(base + ":capture");
    }

    private Long resolveLenderId(Long lenderId) {
        if (lenderId != null) {
            return lenderId;
        }
        return loanProperties.getDemo().getLenderId();
    }

    private String resolveCurrency(Loan loan) {
        if (loan != null && loan.getCurrency() != null && !loan.getCurrency().isBlank()) {
            return loan.getCurrency().trim().toUpperCase(Locale.ROOT);
        }
        String fallback = loanProperties.getDefaultCurrency();
        if (fallback == null || fallback.isBlank()) {
            return "BDT";
        }
        return fallback.trim().toUpperCase(Locale.ROOT);
    }

    private Long resolveHoldId(String walletTxRef, FundingActionRequest request) {
        Long holdId = parseHoldId(walletTxRef);
        if (holdId != null) {
            return holdId;
        }
        if (request == null) {
            return null;
        }
        return parseHoldId(request.walletTxRef());
    }

    private Long parseHoldId(String walletTxRef) {
        if (walletTxRef == null || walletTxRef.isBlank()) {
            return null;
        }
        String normalized = walletTxRef.trim();
        if (normalized.startsWith("hold:")) {
            normalized = normalized.substring(5);
        }
        try {
            return Long.valueOf(normalized);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private FundingResponse toResponse(LoanFunding funding) {
        return new FundingResponse(
                funding.getId(),
                funding.getLoan() != null ? funding.getLoan().getId() : null,
                funding.getLenderUserId(),
                funding.getAmount(),
                funding.getStatus().name(),
                funding.getIdempotencyKey(),
                funding.getWalletTxRef(),
                funding.getCreatedAt(),
                funding.getCapturedAt()
        );
    }
}
