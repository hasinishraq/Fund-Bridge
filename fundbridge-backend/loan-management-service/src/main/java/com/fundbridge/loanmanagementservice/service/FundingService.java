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
import com.fundbridge.loanmanagementservice.repository.LoanFundingRepository;
import com.fundbridge.loanmanagementservice.repository.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class FundingService {

    private final LoanFundingRepository fundingRepository;
    private final LoanRepository loanRepository;
    private final LoanEventService loanEventService;
    private final LoanProperties loanProperties;

    public FundingService(LoanFundingRepository fundingRepository,
                          LoanRepository loanRepository,
                          LoanEventService loanEventService,
                          LoanProperties loanProperties) {
        this.fundingRepository = fundingRepository;
        this.loanRepository = loanRepository;
        this.loanEventService = loanEventService;
        this.loanProperties = loanProperties;
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

        LoanFunding funding = new LoanFunding();
        funding.setLoan(loan);
        funding.setLenderUserId(resolveLenderId(request.lenderId()));
        funding.setAmount(normalizeAmount(request.amount()));
        funding.setStatus(LoanFundingStatus.PLEDGED);
        funding.setIdempotencyKey(idempotencyKey);
        funding.setWalletTxRef(request.walletTxRef());
        fundingRepository.save(funding);
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
        funding.setStatus(LoanFundingStatus.CAPTURED);
        funding.setCapturedAt(Instant.now());
        if (request != null && request.walletTxRef() != null) {
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
        funding.setStatus(LoanFundingStatus.CANCELED);
        if (request != null && request.walletTxRef() != null) {
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
        }
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            throw new BadRequestException("Amount is required");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeIdempotencyKey(String key) {
        String value = (key == null || key.isBlank()) ? UUID.randomUUID().toString() : key.trim();
        if (value.length() > 80) {
            return value.substring(0, 80);
        }
        return value;
    }

    private Long resolveLenderId(Long lenderId) {
        if (lenderId != null) {
            return lenderId;
        }
        return loanProperties.getDemo().getLenderId();
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
