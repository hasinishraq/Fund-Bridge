package com.fundbridge.loanmanagementservice.repository;

import com.fundbridge.loanmanagementservice.entity.LoanInstallment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanInstallmentRepository extends JpaRepository<LoanInstallment, Long> {
    List<LoanInstallment> findByLoan_IdOrderByInstallmentNo(Long loanId);
}
