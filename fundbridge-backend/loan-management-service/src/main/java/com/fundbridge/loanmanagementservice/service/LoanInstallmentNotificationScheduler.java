package com.fundbridge.loanmanagementservice.service;

import com.fundbridge.loanmanagementservice.entity.LoanInstallment;
import com.fundbridge.loanmanagementservice.entity.LoanInstallmentStatus;
import com.fundbridge.loanmanagementservice.repository.LoanInstallmentRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class LoanInstallmentNotificationScheduler {

    private static final List<LoanInstallmentStatus> PENDING_STATUSES =
            List.of(LoanInstallmentStatus.DUE, LoanInstallmentStatus.LATE);

    private final LoanInstallmentRepository installmentRepository;
    private final LoanNotificationService loanNotificationService;

    public LoanInstallmentNotificationScheduler(LoanInstallmentRepository installmentRepository,
                                                 LoanNotificationService loanNotificationService) {
        this.installmentRepository = installmentRepository;
        this.loanNotificationService = loanNotificationService;
    }

    @Scheduled(fixedDelayString = "${loan.notifications.scan-interval-ms:3600000}")
    @Transactional
    public void scanDueInstallments() {
        LocalDate today = LocalDate.now();
        List<LoanInstallment> dueToday = installmentRepository.findByStatusInAndDueDate(PENDING_STATUSES, today);
        for (LoanInstallment installment : dueToday) {
            if (installment.getLoan() == null) {
                continue;
            }
            loanNotificationService.notifyEmiDue(installment.getLoan(), installment);
        }

        List<LoanInstallment> overdue = installmentRepository.findByStatusInAndDueDateBefore(PENDING_STATUSES, today);
        for (LoanInstallment installment : overdue) {
            if (installment.getLoan() == null) {
                continue;
            }
            loanNotificationService.notifyEmiOverdue(installment.getLoan(), installment);
        }
    }
}
