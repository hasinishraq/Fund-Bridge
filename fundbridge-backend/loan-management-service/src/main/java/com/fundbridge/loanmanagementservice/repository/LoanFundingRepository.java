package com.fundbridge.loanmanagementservice.repository;

import com.fundbridge.loanmanagementservice.entity.LoanFunding;
import com.fundbridge.loanmanagementservice.entity.LoanFundingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoanFundingRepository extends JpaRepository<LoanFunding, Long> {
    Optional<LoanFunding> findByIdempotencyKey(String idempotencyKey);

    List<LoanFunding> findByLoan_Id(Long loanId);

    List<LoanFunding> findByLenderUserIdOrderByCreatedAtDesc(Long lenderUserId);

    @Query("""
        select coalesce(sum(f.amount), 0)
        from LoanFunding f
        where f.status = :status
          and (
                (f.capturedAt is not null and f.capturedAt >= :from and f.capturedAt < :to)
             or (f.capturedAt is null and f.createdAt >= :from and f.createdAt < :to)
          )
        """)
    BigDecimal sumCapturedAmount(LoanFundingStatus status, Instant from, Instant to);
}
