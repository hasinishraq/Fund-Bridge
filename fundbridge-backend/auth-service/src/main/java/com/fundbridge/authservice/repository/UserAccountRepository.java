package com.fundbridge.authservice.repository;

import com.fundbridge.authservice.entity.KycStatus;
import com.fundbridge.authservice.entity.UserAccount;
import com.fundbridge.authservice.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    Optional<UserAccount> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Page<UserAccount> findByRoles_NameAndKycStatus(UserRole role, KycStatus status, Pageable pageable);

    Page<UserAccount> findByRoles_Name(UserRole role, Pageable pageable);

    Page<UserAccount> findByKycStatus(KycStatus status, Pageable pageable);

    @Query("select u from UserAccount u join u.roles r where lower(u.email) = lower(:email) and r.name = :role")
    Optional<UserAccount> findByEmailAndRole(@Param("email") String email, @Param("role") UserRole role);
}
