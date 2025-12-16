package com.fundbridge.loanmanagementservice.repository;

import com.fundbridge.loanmanagementservice.entity.LoanFunding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanFundingRepository extends JpaRepository<LoanFunding, Long> {
    Optional<LoanFunding> findByIdempotencyKey(String idempotencyKey);

    List<LoanFunding> findByLoan_Id(Long loanId);

    List<LoanFunding> findByLenderUserIdOrderByCreatedAtDesc(Long lenderUserId);
}
