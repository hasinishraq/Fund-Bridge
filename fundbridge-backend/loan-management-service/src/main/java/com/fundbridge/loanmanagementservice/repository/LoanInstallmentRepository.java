package com.fundbridge.loanmanagementservice.repository;

import com.fundbridge.loanmanagementservice.entity.LoanInstallment;
import com.fundbridge.loanmanagementservice.entity.LoanInstallmentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LoanInstallmentRepository extends JpaRepository<LoanInstallment, Long> {
    List<LoanInstallment> findByLoan_IdOrderByInstallmentNo(Long loanId);

    @EntityGraph(attributePaths = "loan")
    List<LoanInstallment> findByStatusInAndDueDate(List<LoanInstallmentStatus> statuses, LocalDate dueDate);

    @EntityGraph(attributePaths = "loan")
    List<LoanInstallment> findByStatusInAndDueDateBefore(List<LoanInstallmentStatus> statuses, LocalDate dueDate);
}
