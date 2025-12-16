package com.fundbridge.walletservice.repository;

import com.fundbridge.walletservice.entity.WalletBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface WalletBalanceRepository extends JpaRepository<WalletBalance, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from WalletBalance b where b.accountId = :accountId")
    Optional<WalletBalance> findByAccountIdForUpdate(@Param("accountId") Long accountId);
}
