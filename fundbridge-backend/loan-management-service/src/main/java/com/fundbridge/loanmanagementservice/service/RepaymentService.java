package com.fundbridge.loanmanagementservice.service;

import com.fundbridge.loanmanagementservice.dto.EmiScheduleItem;
import com.fundbridge.loanmanagementservice.dto.InstallmentResponse;
import com.fundbridge.loanmanagementservice.dto.PayInstallmentRequest;
import com.fundbridge.loanmanagementservice.entity.LoanFunding;
import com.fundbridge.loanmanagementservice.entity.LoanFundingStatus;
import com.fundbridge.loanmanagementservice.entity.Loan;
import com.fundbridge.loanmanagementservice.entity.LoanEventType;
import com.fundbridge.loanmanagementservice.entity.LoanInstallment;
import com.fundbridge.loanmanagementservice.entity.LoanInstallmentStatus;
import com.fundbridge.loanmanagementservice.entity.LoanStatus;
import com.fundbridge.loanmanagementservice.exception.ResourceConflictException;
import com.fundbridge.loanmanagementservice.exception.ResourceNotFoundException;
import com.fundbridge.loanmanagementservice.integration.wallet.WalletClient;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.TransferRequest;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.WalletSummaryResponse;
import com.fundbridge.loanmanagementservice.integration.wallet.dto.WalletTransactionType;
import com.fundbridge.loanmanagementservice.repository.LoanFundingRepository;
import com.fundbridge.loanmanagementservice.repository.LoanInstallmentRepository;
import com.fundbridge.loanmanagementservice.repository.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RepaymentService {

    private final LoanInstallmentRepository installmentRepository;
    private final LoanRepository loanRepository;
    private final LoanEventService loanEventService;
    private final LoanNotificationService loanNotificationService;
    private final LoanFundingRepository fundingRepository;
    private final WalletClient walletClient;

    public RepaymentService(LoanInstallmentRepository installmentRepository,
                            LoanRepository loanRepository,
                            LoanEventService loanEventService,
                            LoanNotificationService loanNotificationService,
                            LoanFundingRepository fundingRepository,
                            WalletClient walletClient) {
        this.installmentRepository = installmentRepository;
        this.loanRepository = loanRepository;
        this.loanEventService = loanEventService;
        this.loanNotificationService = loanNotificationService;
        this.fundingRepository = fundingRepository;
        this.walletClient = walletClient;
    }

    @Transactional
    public void createSchedule(Loan loan, List<EmiScheduleItem> schedule) {
        if (loan == null || loan.getId() == null || schedule == null || schedule.isEmpty()) {
            return;
        }
        if (!installmentRepository.findByLoan_IdOrderByInstallmentNo(loan.getId()).isEmpty()) {
            return;
        }
        List<LoanInstallment> installments = new ArrayList<>(schedule.size());
        for (EmiScheduleItem item : schedule) {
            LoanInstallment installment = new LoanInstallment();
            installment.setLoan(loan);
            installment.setInstallmentNo(item.installment());
            installment.setDueDate(item.dueDate());
            installment.setPrincipalAmount(item.principalComponent());
            installment.setInterestAmount(item.interestComponent());
            installment.setTotalAmount(item.totalPayment());
            installments.add(installment);
            loan.getInstallments().add(installment);
        }
        installmentRepository.saveAll(installments);
    }

    @Transactional(readOnly = true)
    public List<InstallmentResponse> listInstallments(Long loanId) {
        return installmentRepository.findByLoan_IdOrderByInstallmentNo(loanId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public InstallmentResponse markPaid(Long installmentId, PayInstallmentRequest request) {
        LoanInstallment installment = installmentRepository.findById(installmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Installment not found"));
        if (installment.getStatus() == LoanInstallmentStatus.PAID) {
            throw new ResourceConflictException("Installment already paid");
        }
        Loan loan = installment.getLoan();
        if (loan == null) {
            throw new ResourceNotFoundException("Loan not found for installment");
        }
        if (loan.getStatus() != LoanStatus.ACTIVE) {
            throw new ResourceConflictException("Loan is not active");
        }
        List<LenderShare> shares = distributeRepayment(loan, installment);
        installment.setStatus(LoanInstallmentStatus.PAID);
        installment.setPaidAt(Instant.now());
        if (request != null && request.walletTxRef() != null) {
            installment.setWalletTxRef(request.walletTxRef());
        }
        installmentRepository.save(installment);

        String distributionNote = shares.isEmpty()
                ? "Installment #" + installment.getInstallmentNo() + " paid"
                : "Installment #" + installment.getInstallmentNo() + " paid and distributed to " + shares.size() + " lenders";
        loanEventService.record(loan, LoanEventType.EMI_PAID, loan.getBorrowerUserId(), distributionNote);
        loanNotificationService.notifyEmiPaid(loan, installment);
        boolean allPaid = installmentRepository.findByLoan_IdOrderByInstallmentNo(loan.getId())
                .stream()
                .allMatch(inst -> inst.getStatus() == LoanInstallmentStatus.PAID);
        if (allPaid) {
            loan.setStatus(LoanStatus.CLOSED);
            loan.setClosedAt(Instant.now());
            loanRepository.save(loan);
        }
        return toResponse(installment);
    }

    private List<LenderShare> distributeRepayment(Loan loan, LoanInstallment installment) {
        List<LoanFunding> fundings = fundingRepository.findByLoan_Id(loan.getId());
        Map<Long, BigDecimal> lenderTotals = new HashMap<>();
        BigDecimal totalCaptured = BigDecimal.ZERO;
        for (LoanFunding funding : fundings) {
            if (funding.getStatus() != LoanFundingStatus.CAPTURED) {
                continue;
            }
            BigDecimal amount = funding.getAmount() != null ? funding.getAmount() : BigDecimal.ZERO;
            totalCaptured = totalCaptured.add(amount);
            lenderTotals.merge(funding.getLenderUserId(), amount, BigDecimal::add);
        }
        if (totalCaptured.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResourceConflictException("No captured funding available for repayment distribution");
        }
        List<LenderShare> shares = calculateShares(lenderTotals, installment.getTotalAmount(), totalCaptured);
        if (shares.isEmpty()) {
            return shares;
        }
        String currency = loan.getCurrency();
        WalletSummaryResponse borrowerWallet = walletClient.getWallet(loan.getBorrowerUserId(), currency);
        if (borrowerWallet == null || borrowerWallet.accountId() == null) {
            throw new ResourceConflictException("Borrower wallet unavailable for repayment");
        }
        for (LenderShare share : shares) {
            WalletSummaryResponse lenderWallet = walletClient.getWallet(share.lenderId(), currency);
            if (lenderWallet == null || lenderWallet.accountId() == null) {
                throw new ResourceConflictException("Lender wallet unavailable for repayment distribution");
            }
            TransferRequest transferRequest = new TransferRequest(
                    borrowerWallet.accountId(),
                    lenderWallet.accountId(),
                    share.amount(),
                    currency,
                    WalletTransactionType.EMI_REPAY.name(),
                    String.valueOf(installment.getId()),
                    buildRepaymentIdempotencyKey(installment.getId(), share.lenderId()),
                    buildRepaymentMetadata(loan, installment)
            );
            walletClient.transfer(transferRequest);
        }
        return shares;
    }

    private List<LenderShare> calculateShares(Map<Long, BigDecimal> lenderTotals,
                                              BigDecimal installmentAmount,
                                              BigDecimal totalCaptured) {
        if (lenderTotals.isEmpty()) {
            return List.of();
        }
        BigDecimal totalPayment = installmentAmount == null
                ? BigDecimal.ZERO
                : installmentAmount.setScale(2, RoundingMode.HALF_UP);
        if (totalPayment.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of();
        }
        List<Map.Entry<Long, BigDecimal>> entries = new ArrayList<>(lenderTotals.entrySet());
        entries.sort(Comparator.comparing(Map.Entry::getKey));
        List<LenderShare> shares = new ArrayList<>();
        BigDecimal remaining = totalPayment;
        for (int i = 0; i < entries.size(); i++) {
            Map.Entry<Long, BigDecimal> entry = entries.get(i);
            BigDecimal shareAmount;
            if (i == entries.size() - 1) {
                shareAmount = remaining;
            } else {
                BigDecimal ratio = entry.getValue().divide(totalCaptured, 8, RoundingMode.HALF_UP);
                shareAmount = totalPayment.multiply(ratio).setScale(2, RoundingMode.DOWN);
                remaining = remaining.subtract(shareAmount).setScale(2, RoundingMode.HALF_UP);
            }
            if (shareAmount.compareTo(BigDecimal.ZERO) > 0) {
                shares.add(new LenderShare(entry.getKey(), shareAmount));
            }
        }
        return shares;
    }

    private String buildRepaymentIdempotencyKey(Long installmentId, Long lenderId) {
        return "emi:" + installmentId + ":" + lenderId;
    }

    private String buildRepaymentMetadata(Loan loan, LoanInstallment installment) {
        return "loan=" + loan.getId() + ",installment=" + installment.getInstallmentNo();
    }

    private record LenderShare(Long lenderId, BigDecimal amount) {
    }

    private InstallmentResponse toResponse(LoanInstallment installment) {
        return new InstallmentResponse(
                installment.getId(),
                installment.getInstallmentNo(),
                installment.getDueDate(),
                installment.getPrincipalAmount(),
                installment.getInterestAmount(),
                installment.getTotalAmount(),
                installment.getStatus().name(),
                installment.getPaidAt(),
                installment.getWalletTxRef()
        );
    }
}
