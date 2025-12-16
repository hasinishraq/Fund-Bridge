package com.fundbridge.loanmanagementservice.service;

import com.fundbridge.loanmanagementservice.dto.EmiScheduleItem;
import com.fundbridge.loanmanagementservice.dto.InstallmentResponse;
import com.fundbridge.loanmanagementservice.dto.PayInstallmentRequest;
import com.fundbridge.loanmanagementservice.entity.Loan;
import com.fundbridge.loanmanagementservice.entity.LoanEventType;
import com.fundbridge.loanmanagementservice.entity.LoanInstallment;
import com.fundbridge.loanmanagementservice.entity.LoanInstallmentStatus;
import com.fundbridge.loanmanagementservice.entity.LoanStatus;
import com.fundbridge.loanmanagementservice.exception.ResourceConflictException;
import com.fundbridge.loanmanagementservice.exception.ResourceNotFoundException;
import com.fundbridge.loanmanagementservice.repository.LoanInstallmentRepository;
import com.fundbridge.loanmanagementservice.repository.LoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class RepaymentService {

    private final LoanInstallmentRepository installmentRepository;
    private final LoanRepository loanRepository;
    private final LoanEventService loanEventService;

    public RepaymentService(LoanInstallmentRepository installmentRepository,
                            LoanRepository loanRepository,
                            LoanEventService loanEventService) {
        this.installmentRepository = installmentRepository;
        this.loanRepository = loanRepository;
        this.loanEventService = loanEventService;
    }

    @Transactional
    public void createSchedule(Loan loan, List<EmiScheduleItem> schedule) {
        if (schedule == null || schedule.isEmpty()) {
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
        installment.setStatus(LoanInstallmentStatus.PAID);
        installment.setPaidAt(Instant.now());
        if (request != null && request.walletTxRef() != null) {
            installment.setWalletTxRef(request.walletTxRef());
        }
        installmentRepository.save(installment);

        Loan loan = installment.getLoan();
        if (loan != null) {
            loanEventService.record(loan, LoanEventType.EMI_PAID, loan.getBorrowerUserId(),
                    "Installment #" + installment.getInstallmentNo() + " paid");
            boolean allPaid = installmentRepository.findByLoan_IdOrderByInstallmentNo(loan.getId())
                    .stream()
                    .allMatch(inst -> inst.getStatus() == LoanInstallmentStatus.PAID);
            if (allPaid) {
                loan.setStatus(LoanStatus.CLOSED);
                loan.setClosedAt(Instant.now());
                loanRepository.save(loan);
            }
        }
        return toResponse(installment);
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
