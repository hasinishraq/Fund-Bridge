package com.fundbridge.walletservice.repository;

import com.fundbridge.walletservice.entity.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    Optional<WalletTransaction> findByIdempotencyKey(String idempotencyKey);

    List<WalletTransaction> findByFromAccount_IdOrToAccount_IdOrderByCreatedAtDesc(Long fromAccountId, Long toAccountId);
}
