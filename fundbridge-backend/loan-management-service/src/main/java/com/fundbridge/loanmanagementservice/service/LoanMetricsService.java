package com.fundbridge.loanmanagementservice.service;

import com.fundbridge.loanmanagementservice.dto.LoanMetricsResponse;
import com.fundbridge.loanmanagementservice.entity.LoanFundingStatus;
import com.fundbridge.loanmanagementservice.entity.LoanInstallmentStatus;
import com.fundbridge.loanmanagementservice.entity.LoanStatus;
import com.fundbridge.loanmanagementservice.repository.LoanFundingRepository;
import com.fundbridge.loanmanagementservice.repository.LoanInstallmentRepository;
import com.fundbridge.loanmanagementservice.repository.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class LoanMetricsService {

    private final LoanRepository loanRepository;
    private final LoanFundingRepository fundingRepository;
    private final LoanInstallmentRepository installmentRepository;

    public LoanMetricsService(LoanRepository loanRepository,
                              LoanFundingRepository fundingRepository,
                              LoanInstallmentRepository installmentRepository) {
        this.loanRepository = loanRepository;
        this.fundingRepository = fundingRepository;
        this.installmentRepository = installmentRepository;
    }

    public LoanMetricsResponse getMetrics(LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now(ZoneOffset.UTC);
        Instant from = targetDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant to = targetDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        List<LoanStatus> outstandingStatuses = List.of(
                LoanStatus.REQUESTED,
                LoanStatus.APPROVED,
                LoanStatus.FUNDING,
                LoanStatus.FUNDED,
                LoanStatus.ACTIVE,
                LoanStatus.DEFAULTED
        );
        BigDecimal totalOutstanding = loanRepository.sumAmountByStatusIn(outstandingStatuses);

        BigDecimal disbursements = fundingRepository.sumCapturedAmount(LoanFundingStatus.CAPTURED, from, to);

        List<LoanInstallmentStatus> dueStatuses = List.of(
                LoanInstallmentStatus.DUE,
                LoanInstallmentStatus.LATE
        );
        BigDecimal dueToday = installmentRepository.sumTotalAmountByStatusInAndDueDate(dueStatuses, targetDate);
        BigDecimal overdue = installmentRepository.sumTotalAmountByStatusInAndDueDateBefore(dueStatuses, targetDate);

        Instant windowStart = Instant.now().minus(30, ChronoUnit.DAYS);
        Instant windowEnd = Instant.now();
        long totalRecent = loanRepository.countByCreatedAtBetween(windowStart, windowEnd);
        long defaultedRecent = loanRepository.countByStatusAndCreatedAtBetween(LoanStatus.DEFAULTED, windowStart, windowEnd);
        BigDecimal defaultRate = BigDecimal.ZERO;
        if (totalRecent > 0) {
            defaultRate = BigDecimal.valueOf((double) defaultedRecent * 100 / totalRecent)
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return new LoanMetricsResponse(
                totalOutstanding,
                disbursements,
                dueToday,
                overdue,
                defaultRate,
                Instant.now()
        );
    }
}
