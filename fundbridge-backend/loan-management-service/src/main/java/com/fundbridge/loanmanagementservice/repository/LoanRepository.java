package com.fundbridge.loanmanagementservice.repository;

import com.fundbridge.loanmanagementservice.entity.Loan;
import com.fundbridge.loanmanagementservice.entity.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByBorrowerUserIdOrderByCreatedAtDesc(Long borrowerUserId);

    List<Loan> findByBorrowerUserIdAndStatusInOrderByCreatedAtDesc(Long borrowerUserId, List<LoanStatus> statuses);

    List<Loan> findByStatusInOrderByCreatedAtDesc(List<LoanStatus> statuses);

    List<Loan> findAllByOrderByCreatedAtDesc();
}
