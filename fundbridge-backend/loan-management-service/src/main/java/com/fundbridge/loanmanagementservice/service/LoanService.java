package com.fundbridge.loanmanagementservice.service;

import com.fundbridge.loanmanagementservice.config.LoanProperties;
import com.fundbridge.loanmanagementservice.dto.CreateLoanRequest;
import com.fundbridge.loanmanagementservice.dto.LoanDetailResponse;
import com.fundbridge.loanmanagementservice.dto.LoanResponse;
import com.fundbridge.loanmanagementservice.dto.UpdateLoanStatusRequest;
import com.fundbridge.loanmanagementservice.entity.Loan;
import com.fundbridge.loanmanagementservice.entity.LoanEventType;
import com.fundbridge.loanmanagementservice.entity.LoanStatus;
import com.fundbridge.loanmanagementservice.exception.BadRequestException;
import com.fundbridge.loanmanagementservice.exception.ResourceNotFoundException;
import com.fundbridge.loanmanagementservice.repository.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
public class LoanService {

    private final LoanRepository loanRepository;
    private final EmiCalculatorService emiCalculatorService;
    private final RepaymentService repaymentService;
    private final FundingService fundingService;
    private final LoanEventService loanEventService;
    private final LoanProperties loanProperties;

    public LoanService(LoanRepository loanRepository,
                       EmiCalculatorService emiCalculatorService,
                       RepaymentService repaymentService,
                       FundingService fundingService,
                       LoanEventService loanEventService,
                       LoanProperties loanProperties) {
        this.loanRepository = loanRepository;
        this.emiCalculatorService = emiCalculatorService;
        this.repaymentService = repaymentService;
        this.fundingService = fundingService;
        this.loanEventService = loanEventService;
        this.loanProperties = loanProperties;
    }

    @Transactional
    public LoanResponse createLoan(CreateLoanRequest request) {
        Loan loan = new Loan();
        loan.setBorrowerUserId(resolveBorrowerId(request.borrowerId()));
        loan.setAmount(normalizeAmount(request.amount()));
        loan.setCurrency(normalizeCurrency(request.currency()));
        loan.setInterestRate(normalizeRate(request.interestRatePercent()));
        loan.setTermMonths(request.tenureMonths());
        loan.setPurpose(request.purpose());
        loan.setStatus(LoanStatus.REQUESTED);
        loanRepository.save(loan);

        repaymentService.createSchedule(loan,
                emiCalculatorService.buildSchedule(loan.getAmount(), loan.getInterestRate(), loan.getTermMonths()));

        loanEventService.record(loan, LoanEventType.CREATED, loan.getBorrowerUserId(), "Loan requested");
        return toResponse(loan);
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> listLoans(Long borrowerId) {
        Long resolvedBorrower = resolveBorrowerId(borrowerId);
        return loanRepository.findByBorrowerUserIdOrderByCreatedAtDesc(resolvedBorrower)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LoanDetailResponse getLoanDetail(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        return new LoanDetailResponse(
                loan.getId(),
                loan.getBorrowerUserId(),
                loan.getAmount(),
                loan.getCurrency(),
                loan.getInterestRate(),
                loan.getTermMonths(),
                loan.getPurpose(),
                toDisplayStatus(loan.getStatus()),
                loan.getCreatedAt(),
                loan.getUpdatedAt(),
                loan.getApprovedAt(),
                loan.getActivatedAt(),
                loan.getClosedAt(),
                fundingService.listFundingsForLoan(loanId),
                repaymentService.listInstallments(loanId),
                loanEventService.listForLoan(loanId)
        );
    }

    @Transactional
    public LoanResponse updateStatus(Long loanId, UpdateLoanStatusRequest request) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        LoanStatus targetStatus = parseStatus(request.status());
        loan.setStatus(targetStatus);
        Instant now = Instant.now();
        switch (targetStatus) {
            case APPROVED -> loan.setApprovedAt(now);
            case FUNDED, ACTIVE -> loan.setActivatedAt(now);
            case CLOSED, DEFAULTED, REJECTED -> loan.setClosedAt(now);
            default -> { }
        }
        LoanEventType eventType = switch (targetStatus) {
            case REQUESTED -> LoanEventType.CREATED;
            case APPROVED -> LoanEventType.APPROVED;
            case FUNDED -> LoanEventType.FUNDED;
            case DEFAULTED -> LoanEventType.DEFAULTED;
            default -> null;
        };
        if (eventType != null) {
            loanEventService.record(loan, eventType, null, "Status updated to " + targetStatus);
        }
        return toResponse(loanRepository.save(loan));
    }

    private LoanStatus parseStatus(String status) {
        try {
            if (status == null || status.isBlank()) {
                throw new BadRequestException("Status is required");
            }
            String normalized = status.trim().toUpperCase();
            // Accept common aliases from the UI
            if ("PENDING".equals(normalized)) {
                normalized = "REQUESTED";
            } else if ("DISBURSED".equals(normalized)) {
                normalized = "FUNDED";
            }
            return LoanStatus.valueOf(normalized);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid status: " + status);
        }
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizeRate(BigDecimal ratePercent) {
        BigDecimal defaultRate = loanProperties.getDefaultInterestRatePercent();
        if (ratePercent == null) {
            return defaultRate;
        }
        return ratePercent.setScale(3, RoundingMode.HALF_UP);
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return loanProperties.getDefaultCurrency();
        }
        return currency.trim().toUpperCase();
    }

    private Long resolveBorrowerId(Long borrowerId) {
        if (borrowerId != null) {
            return borrowerId;
        }
        return loanProperties.getDemo().getBorrowerId();
    }

    private LoanResponse toResponse(Loan loan) {
        return new LoanResponse(
                loan.getId(),
                loan.getBorrowerUserId(),
                loan.getAmount(),
                loan.getCurrency(),
                loan.getInterestRate(),
                loan.getTermMonths(),
                loan.getPurpose(),
                toDisplayStatus(loan.getStatus()),
                loan.getCreatedAt(),
                loan.getUpdatedAt(),
                loan.getApprovedAt(),
                loan.getActivatedAt(),
                loan.getClosedAt()
        );
    }

    private String toDisplayStatus(LoanStatus status) {
        if (status == null) {
            return null;
        }
        return switch (status) {
            case REQUESTED -> "PENDING";
            case FUNDED -> "DISBURSED";
            default -> status.name();
        };
    }
}
