package com.fundbridge.authservice.repository;

import com.fundbridge.authservice.entity.AuthRole;
import com.fundbridge.authservice.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthRoleRepository extends JpaRepository<AuthRole, Long> {
    Optional<AuthRole> findByName(UserRole name);
}
