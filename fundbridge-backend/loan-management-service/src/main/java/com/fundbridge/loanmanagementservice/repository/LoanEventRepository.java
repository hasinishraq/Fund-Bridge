package com.fundbridge.loanmanagementservice.repository;

import com.fundbridge.loanmanagementservice.entity.LoanEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanEventRepository extends JpaRepository<LoanEvent, Long> {
    List<LoanEvent> findByLoan_IdOrderByCreatedAtAsc(Long loanId);
}
