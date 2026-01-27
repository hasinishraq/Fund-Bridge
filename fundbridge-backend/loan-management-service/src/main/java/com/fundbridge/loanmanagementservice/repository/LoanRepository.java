package com.fundbridge.loanmanagementservice.repository;

import com.fundbridge.loanmanagementservice.entity.Loan;
import com.fundbridge.loanmanagementservice.entity.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByBorrowerUserIdOrderByCreatedAtDesc(Long borrowerUserId);

    List<Loan> findByBorrowerUserIdAndStatusInOrderByCreatedAtDesc(Long borrowerUserId, List<LoanStatus> statuses);

    List<Loan> findByStatusInOrderByCreatedAtDesc(List<LoanStatus> statuses);

    List<Loan> findAllByOrderByCreatedAtDesc();

    @Query("select coalesce(sum(l.amount), 0) from Loan l where l.status in :statuses")
    BigDecimal sumAmountByStatusIn(List<LoanStatus> statuses);

    long countByCreatedAtBetween(Instant from, Instant to);

    long countByStatusAndCreatedAtBetween(LoanStatus status, Instant from, Instant to);
}
