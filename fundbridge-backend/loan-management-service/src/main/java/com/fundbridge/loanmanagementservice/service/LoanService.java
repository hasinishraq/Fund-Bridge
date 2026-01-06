package com.fundbridge.loanmanagementservice.service;

import com.fundbridge.loanmanagementservice.config.LoanProperties;
import com.fundbridge.loanmanagementservice.dto.CreateLoanRequest;
import com.fundbridge.loanmanagementservice.dto.LoanDetailResponse;
import com.fundbridge.loanmanagementservice.dto.LoanResponse;
import com.fundbridge.loanmanagementservice.dto.AcceptLoanRequest;
import com.fundbridge.loanmanagementservice.dto.UpdateLoanStatusRequest;
import com.fundbridge.loanmanagementservice.dto.FundingResponse;
import com.fundbridge.loanmanagementservice.dto.CreditScoreResponse;
import com.fundbridge.loanmanagementservice.entity.Loan;
import com.fundbridge.loanmanagementservice.entity.LoanEventType;
import com.fundbridge.loanmanagementservice.entity.LoanFunding;
import com.fundbridge.loanmanagementservice.entity.LoanFundingStatus;
import com.fundbridge.loanmanagementservice.entity.LoanInstallment;
import com.fundbridge.loanmanagementservice.entity.LoanInstallmentStatus;
import com.fundbridge.loanmanagementservice.entity.LoanStatus;
import com.fundbridge.loanmanagementservice.exception.BadRequestException;
import com.fundbridge.loanmanagementservice.exception.ResourceConflictException;
import com.fundbridge.loanmanagementservice.exception.ResourceNotFoundException;
import com.fundbridge.loanmanagementservice.repository.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
public class LoanService {

    private final LoanRepository loanRepository;
    private final EmiCalculatorService emiCalculatorService;
    private final RepaymentService repaymentService;
    private final FundingService fundingService;
    private final LoanEventService loanEventService;
    private final CreditScoreService creditScoreService;
    private final LoanProperties loanProperties;

    public LoanService(LoanRepository loanRepository,
                       EmiCalculatorService emiCalculatorService,
                       RepaymentService repaymentService,
                       FundingService fundingService,
                       LoanEventService loanEventService,
                       CreditScoreService creditScoreService,
                       LoanProperties loanProperties) {
        this.loanRepository = loanRepository;
        this.emiCalculatorService = emiCalculatorService;
        this.repaymentService = repaymentService;
        this.fundingService = fundingService;
        this.loanEventService = loanEventService;
        this.creditScoreService = creditScoreService;
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

        loanEventService.record(loan, LoanEventType.CREATED, loan.getBorrowerUserId(), "Loan requested");
        return toResponse(loan);
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> listLoans(Long borrowerId,
                                        String scope,
                                        String statuses,
                                        String query,
                                        BigDecimal minAmount,
                                        BigDecimal maxAmount,
                                        BigDecimal minRate,
                                        BigDecimal maxRate,
                                        Integer minTenure,
                                        Integer maxTenure) {
        boolean lenderScope = scope != null && scope.equalsIgnoreCase("LENDER");
        boolean marketplaceScope = lenderScope || (scope != null && scope.equalsIgnoreCase("MARKETPLACE"));
        List<LoanStatus> statusFilter = parseStatusFilter(statuses);
        List<Loan> loans;
        if (marketplaceScope) {
            loans = statusFilter.isEmpty()
                    ? loanRepository.findAllByOrderByCreatedAtDesc()
                    : loanRepository.findByStatusInOrderByCreatedAtDesc(statusFilter);
        } else {
            Long resolvedBorrower = resolveBorrowerId(borrowerId);
            loans = statusFilter.isEmpty()
                    ? loanRepository.findByBorrowerUserIdOrderByCreatedAtDesc(resolvedBorrower)
                    : loanRepository.findByBorrowerUserIdAndStatusInOrderByCreatedAtDesc(resolvedBorrower, statusFilter);
        }
        List<Loan> filtered = applyFilters(loans, query, minAmount, maxAmount, minRate, maxRate, minTenure, maxTenure);
        return filtered.stream()
                .map(loan -> toResponse(loan, computeAggregates(loan)))
                .toList();
    }

    @Transactional(readOnly = true)
    public LoanDetailResponse getLoanDetail(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        LoanAggregate aggregates = computeAggregates(loan);
        CreditScoreResponse creditScore = resolveCreditScore(loan);
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
                aggregates.pledgedAmount(),
                aggregates.capturedAmount(),
                aggregates.installmentsPaid(),
                aggregates.installmentsTotal(),
                aggregates.nextDueDate(),
                aggregates.nextDueAmount(),
                fundingService.listFundingsForLoan(loanId),
                repaymentService.listInstallments(loanId),
                loanEventService.listForLoan(loanId),
                creditScore != null ? creditScore.score() : null,
                creditScore != null ? creditScore.grade() : null,
                creditScore != null ? creditScore.lastUpdated() : null
        );
    }

    @Transactional
    public LoanResponse updateStatus(Long loanId, UpdateLoanStatusRequest request) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        LoanStatus targetStatus = parseStatus(request.status());
        if (targetStatus == LoanStatus.ACTIVE) {
            return acceptLoan(loanId, new AcceptLoanRequest(null));
        }
        if (targetStatus == LoanStatus.FUNDED) {
            BigDecimal committed = fundingService.getCommittedAmount(loanId);
            if (committed.compareTo(loan.getAmount()) < 0) {
                throw new ResourceConflictException("Loan is not fully funded");
            }
        }
        loan.setStatus(targetStatus);
        Instant now = Instant.now();
        switch (targetStatus) {
            case APPROVED, FUNDING -> loan.setApprovedAt(now);
            case CLOSED, DEFAULTED, REJECTED -> loan.setClosedAt(now);
            default -> { }
        }
        LoanEventType eventType = switch (targetStatus) {
            case REQUESTED -> LoanEventType.CREATED;
            case APPROVED, FUNDING -> LoanEventType.APPROVED;
            case FUNDED -> LoanEventType.FUNDED;
            case DEFAULTED -> LoanEventType.DEFAULTED;
            default -> null;
        };
        if (eventType != null) {
            loanEventService.record(loan, eventType, null, "Status updated to " + targetStatus);
        }
        return toResponse(loanRepository.save(loan));
    }

    @Transactional
    public LoanResponse acceptLoan(Long loanId, AcceptLoanRequest request) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        if (loan.getStatus() == LoanStatus.CLOSED || loan.getStatus() == LoanStatus.DEFAULTED
                || loan.getStatus() == LoanStatus.REJECTED) {
            throw new ResourceConflictException("Loan cannot be accepted in its current state");
        }
        Long borrowerId = request != null ? request.borrowerId() : null;
        if (borrowerId != null && !borrowerId.equals(loan.getBorrowerUserId())) {
            throw new BadRequestException("Borrower does not match this loan");
        }
        Long resolvedBorrowerId = borrowerId != null ? borrowerId : loan.getBorrowerUserId();
        if (loan.getStatus() == LoanStatus.ACTIVE) {
            return toResponse(loan);
        }
        List<FundingResponse> fundings = fundingService.listFundingsForLoan(loanId);
        BigDecimal committed = fundings.stream()
                .filter(funding -> isCommittedFunding(funding.status()))
                .map(FundingResponse::amount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        if (committed.compareTo(loan.getAmount()) < 0) {
            throw new ResourceConflictException("Loan is not fully funded");
        }
        if (loan.getStatus() != LoanStatus.FUNDED) {
            loan.setStatus(LoanStatus.FUNDED);
            loanRepository.save(loan);
            loanEventService.record(loan, LoanEventType.FUNDED, null,
                    "Loan fully funded with total " + committed);
        }
        for (FundingResponse funding : fundings) {
            if (LoanFundingStatus.PLEDGED.name().equalsIgnoreCase(funding.status())) {
                fundingService.disburseFunding(funding.id(), resolvedBorrowerId);
            }
        }
        repaymentService.createSchedule(loan,
                emiCalculatorService.buildSchedule(loan.getAmount(), loan.getInterestRate(), loan.getTermMonths()));
        loan.setStatus(LoanStatus.ACTIVE);
        loan.setActivatedAt(Instant.now());
        loanRepository.save(loan);
        loanEventService.record(loan, LoanEventType.ACTIVATED, resolvedBorrowerId,
                "Loan accepted and activated");
        return toResponse(loan);
    }

    private List<LoanStatus> parseStatusFilter(String statuses) {
        if (statuses == null || statuses.isBlank()) {
            return List.of();
        }
        List<LoanStatus> parsed = new ArrayList<>();
        for (String token : statuses.split(",")) {
            if (token == null || token.isBlank()) {
                continue;
            }
            try {
                parsed.add(parseStatus(token));
            } catch (BadRequestException ignored) {
                // Ignore invalid values so callers can send user-facing labels
            }
        }
        if (parsed.isEmpty()) {
            throw new BadRequestException("No valid statuses provided");
        }
        return parsed;
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
                normalized = "ACTIVE";
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

    private List<Loan> applyFilters(List<Loan> loans,
                                    String query,
                                    BigDecimal minAmount,
                                    BigDecimal maxAmount,
                                    BigDecimal minRate,
                                    BigDecimal maxRate,
                                    Integer minTenure,
                                    Integer maxTenure) {
        if (loans == null || loans.isEmpty()) {
            return List.of();
        }
        String normalizedQuery = query == null ? null : query.trim().toLowerCase();
        return loans.stream()
                .filter(loan -> matchesQuery(loan, normalizedQuery))
                .filter(loan -> matchesRange(loan.getAmount(), minAmount, maxAmount))
                .filter(loan -> matchesRange(loan.getInterestRate(), minRate, maxRate))
                .filter(loan -> matchesTenure(loan.getTermMonths(), minTenure, maxTenure))
                .toList();
    }

    private boolean matchesQuery(Loan loan, String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) {
            return true;
        }
        boolean matchesPurpose = loan.getPurpose() != null
                && loan.getPurpose().toLowerCase().contains(normalizedQuery);
        boolean matchesId = loan.getId() != null
                && String.valueOf(loan.getId()).contains(normalizedQuery);
        return matchesPurpose || matchesId;
    }

    private boolean matchesRange(BigDecimal value, BigDecimal min, BigDecimal max) {
        BigDecimal safeValue = value == null ? BigDecimal.ZERO : value;
        if (min != null && safeValue.compareTo(min) < 0) {
            return false;
        }
        if (max != null && safeValue.compareTo(max) > 0) {
            return false;
        }
        return true;
    }

    private boolean matchesTenure(int value, Integer min, Integer max) {
        if (min != null && value < min) {
            return false;
        }
        if (max != null && value > max) {
            return false;
        }
        return true;
    }

    private LoanResponse toResponse(Loan loan) {
        return toResponse(loan, computeAggregates(loan));
    }

    private LoanResponse toResponse(Loan loan, LoanAggregate aggregates) {
        CreditScoreResponse creditScore = resolveCreditScore(loan);
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
                loan.getClosedAt(),
                aggregates.pledgedAmount(),
                aggregates.capturedAmount(),
                aggregates.installmentsPaid(),
                aggregates.installmentsTotal(),
                aggregates.nextDueDate(),
                aggregates.nextDueAmount(),
                creditScore != null ? creditScore.score() : null,
                creditScore != null ? creditScore.grade() : null,
                creditScore != null ? creditScore.lastUpdated() : null
        );
    }

    private String toDisplayStatus(LoanStatus status) {
        if (status == null) {
            return null;
        }
        return status.name();
    }

    private CreditScoreResponse resolveCreditScore(Loan loan) {
        if (loan == null) {
            return null;
        }
        return creditScoreService.getScoreForUser(loan.getBorrowerUserId());
    }

    private boolean isCommittedFunding(String status) {
        if (status == null) {
            return false;
        }
        try {
            LoanFundingStatus fundingStatus = LoanFundingStatus.valueOf(status);
            return fundingStatus != LoanFundingStatus.CANCELED && fundingStatus != LoanFundingStatus.REFUNDED;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private LoanAggregate computeAggregates(Loan loan) {
        if (loan == null) {
            return new LoanAggregate(BigDecimal.ZERO, BigDecimal.ZERO, 0, 0, null, null);
        }
        List<LoanFunding> fundings = loan.getFundings() == null ? List.of() : loan.getFundings();
        BigDecimal pledged = fundings.stream()
                .filter(Objects::nonNull)
                .filter(f -> f.getStatus() != null
                        && f.getStatus() != LoanFundingStatus.CANCELED
                        && f.getStatus() != LoanFundingStatus.REFUNDED)
                .map(LoanFunding::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal captured = fundings.stream()
                .filter(Objects::nonNull)
                .filter(f -> f.getStatus() == LoanFundingStatus.CAPTURED)
                .map(LoanFunding::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        List<LoanInstallment> installments = loan.getInstallments() == null ? List.of() : loan.getInstallments();
        int totalInstallments = installments.size();
        int paidInstallments = (int) installments.stream()
                .filter(inst -> inst.getStatus() == LoanInstallmentStatus.PAID)
                .count();
        LoanInstallment nextDue = installments.stream()
                .filter(inst -> inst.getStatus() != LoanInstallmentStatus.PAID)
                .sorted(Comparator.comparing(LoanInstallment::getDueDate))
                .findFirst()
                .orElse(null);
        LocalDate nextDueDate = nextDue != null ? nextDue.getDueDate() : null;
        BigDecimal nextDueAmount = nextDue != null ? nextDue.getTotalAmount() : null;

        return new LoanAggregate(pledged, captured, paidInstallments, totalInstallments, nextDueDate, nextDueAmount);
    }

    private record LoanAggregate(
            BigDecimal pledgedAmount,
            BigDecimal capturedAmount,
            int installmentsPaid,
            int installmentsTotal,
            LocalDate nextDueDate,
            BigDecimal nextDueAmount
    ) {
    }
}
