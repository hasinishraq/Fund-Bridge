package com.fundbridge.walletservice.repository;

import com.fundbridge.walletservice.entity.TransactionStatus;
import com.fundbridge.walletservice.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    Optional<WalletTransaction> findByCreatedByUserIdAndIdempotencyHash(Long createdByUserId, String idempotencyHash);

    List<WalletTransaction> findByFromAccount_IdOrToAccount_IdOrderByCreatedAtDesc(Long fromAccountId, Long toAccountId);

    @Query("""
        select count(t)
        from WalletTransaction t
        where t.status = :status
          and t.createdAt >= :from
          and t.createdAt < :to
        """)
    long countByStatusAndCreatedAtBetween(TransactionStatus status, Instant from, Instant to);

    @Query("""
        select count(t)
        from WalletTransaction t
        where t.status = :status
          and t.createdAt >= :from
          and t.createdAt < :to
          and lower(coalesce(t.referenceType, '')) like concat('%', :referenceToken, '%')
        """)
    long countByStatusAndReferenceTypeContaining(TransactionStatus status,
                                                 Instant from,
                                                 Instant to,
                                                 String referenceToken);
}
