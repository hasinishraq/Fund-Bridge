package com.fundbridge.walletservice.repository;

import com.fundbridge.walletservice.entity.HoldStatus;
import com.fundbridge.walletservice.entity.WalletHold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface WalletHoldRepository extends JpaRepository<WalletHold, Long> {

    List<WalletHold> findByAccount_IdAndStatus(Long accountId, HoldStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select h from WalletHold h where h.id = :id")
    Optional<WalletHold> findByIdForUpdate(@Param("id") Long id);
}
