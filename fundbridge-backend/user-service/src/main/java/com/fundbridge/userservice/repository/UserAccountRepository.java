package com.fundbridge.userservice.repository;

import com.fundbridge.userservice.entity.KycStatus;
import com.fundbridge.userservice.entity.UserAccount;
import com.fundbridge.userservice.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Page<UserAccount> findByRoleAndKycStatus(UserRole role, KycStatus status, Pageable pageable);

    Page<UserAccount> findByRole(UserRole role, Pageable pageable);

    Page<UserAccount> findByKycStatus(KycStatus status, Pageable pageable);
}
