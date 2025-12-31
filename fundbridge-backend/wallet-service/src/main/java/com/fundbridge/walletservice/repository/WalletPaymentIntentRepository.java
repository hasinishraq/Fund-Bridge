package com.fundbridge.walletservice.repository;

import com.fundbridge.walletservice.entity.WalletPaymentIntent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface WalletPaymentIntentRepository extends JpaRepository<WalletPaymentIntent, Long> {

    Optional<WalletPaymentIntent> findByPaymentIntentId(String paymentIntentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from WalletPaymentIntent w where w.paymentIntentId = :paymentIntentId")
    Optional<WalletPaymentIntent> findByPaymentIntentIdForUpdate(@Param("paymentIntentId") String paymentIntentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from WalletPaymentIntent w where w.userId = :userId and w.idempotencyKey = :idempotencyKey")
    Optional<WalletPaymentIntent> findByUserIdAndIdempotencyKeyForUpdate(@Param("userId") Long userId,
                                                                         @Param("idempotencyKey") String idempotencyKey);
}
