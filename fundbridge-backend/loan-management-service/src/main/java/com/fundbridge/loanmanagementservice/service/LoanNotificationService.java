package com.fundbridge.loanmanagementservice.service;

import com.fundbridge.loanmanagementservice.entity.Loan;
import com.fundbridge.loanmanagementservice.entity.LoanInstallment;
import com.fundbridge.loanmanagementservice.integration.notification.NotificationClient;
import com.fundbridge.loanmanagementservice.integration.notification.NotificationDispatchRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LoanNotificationService {

    private static final List<String> DEFAULT_CHANNELS = List.of("EMAIL", "INAPP");

    static final String TEMPLATE_LOAN_SUBMITTED = "LOAN_APPLICATION_SUBMITTED";
    static final String TEMPLATE_LOAN_APPROVED = "LOAN_APPROVED";
    static final String TEMPLATE_LOAN_REJECTED = "LOAN_REJECTED";
    static final String TEMPLATE_LOAN_DISBURSED = "LOAN_DISBURSED";
    static final String TEMPLATE_EMI_DUE = "EMI_DUE";
    static final String TEMPLATE_EMI_OVERDUE = "EMI_OVERDUE";
    static final String TEMPLATE_EMI_PAID = "EMI_PAID";

    private final NotificationClient notificationClient;

    public LoanNotificationService(NotificationClient notificationClient) {
        this.notificationClient = notificationClient;
    }

    public void notifyLoanSubmitted(Loan loan) {
        if (loan == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("loanId", loan.getId());
        payload.put("amount", loan.getAmount());
        payload.put("currency", loan.getCurrency());
        payload.put("interestRatePercent", loan.getInterestRate());
        payload.put("termMonths", loan.getTermMonths());
        payload.put("purpose", loan.getPurpose());
        dispatch(loan.getBorrowerUserId(), TEMPLATE_LOAN_SUBMITTED, payload,
                "loan:" + loan.getId() + ":submitted", null);
    }

    public void notifyLoanApproved(Loan loan) {
        if (loan == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("loanId", loan.getId());
        payload.put("amount", loan.getAmount());
        payload.put("currency", loan.getCurrency());
        payload.put("approvedAt", loan.getApprovedAt());
        dispatch(loan.getBorrowerUserId(), TEMPLATE_LOAN_APPROVED, payload,
                "loan:" + loan.getId() + ":approved", null);
    }

    public void notifyLoanRejected(Loan loan) {
        if (loan == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("loanId", loan.getId());
        payload.put("amount", loan.getAmount());
        payload.put("currency", loan.getCurrency());
        payload.put("closedAt", loan.getClosedAt());
        dispatch(loan.getBorrowerUserId(), TEMPLATE_LOAN_REJECTED, payload,
                "loan:" + loan.getId() + ":rejected", null);
    }

    public void notifyLoanDisbursed(Loan loan) {
        if (loan == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("loanId", loan.getId());
        payload.put("amount", loan.getAmount());
        payload.put("currency", loan.getCurrency());
        payload.put("activatedAt", loan.getActivatedAt());
        dispatch(loan.getBorrowerUserId(), TEMPLATE_LOAN_DISBURSED, payload,
                "loan:" + loan.getId() + ":disbursed", null);
    }

    public void notifyEmiPaid(Loan loan, LoanInstallment installment) {
        if (loan == null || installment == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("loanId", loan.getId());
        payload.put("installmentId", installment.getId());
        payload.put("installmentNo", installment.getInstallmentNo());
        payload.put("amount", installment.getTotalAmount());
        payload.put("currency", loan.getCurrency());
        payload.put("paidAt", installment.getPaidAt());
        dispatch(loan.getBorrowerUserId(), TEMPLATE_EMI_PAID, payload,
                "loan:" + loan.getId() + ":installment:" + installment.getId() + ":paid", null);
    }

    public void notifyEmiDue(Loan loan, LoanInstallment installment) {
        if (loan == null || installment == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("loanId", loan.getId());
        payload.put("installmentId", installment.getId());
        payload.put("installmentNo", installment.getInstallmentNo());
        payload.put("amount", installment.getTotalAmount());
        payload.put("currency", loan.getCurrency());
        payload.put("dueDate", installment.getDueDate());
        dispatch(loan.getBorrowerUserId(), TEMPLATE_EMI_DUE, payload,
                "loan:" + loan.getId() + ":installment:" + installment.getId() + ":due", null);
    }

    public void notifyEmiOverdue(Loan loan, LoanInstallment installment) {
        if (loan == null || installment == null) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("loanId", loan.getId());
        payload.put("installmentId", installment.getId());
        payload.put("installmentNo", installment.getInstallmentNo());
        payload.put("amount", installment.getTotalAmount());
        payload.put("currency", loan.getCurrency());
        payload.put("dueDate", installment.getDueDate());
        dispatch(loan.getBorrowerUserId(), TEMPLATE_EMI_OVERDUE, payload,
                "loan:" + loan.getId() + ":installment:" + installment.getId() + ":overdue", null);
    }

    private void dispatch(Long userId,
                          String templateKey,
                          Map<String, Object> payload,
                          String idempotencyKey,
                          Instant scheduledAt) {
        if (userId == null) {
            return;
        }
        notificationClient.dispatch(new NotificationDispatchRequest(
                userId,
                templateKey,
                payload,
                DEFAULT_CHANNELS,
                scheduledAt,
                idempotencyKey
        ));
    }
}
