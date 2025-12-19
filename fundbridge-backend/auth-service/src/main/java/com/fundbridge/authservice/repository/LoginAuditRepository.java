package com.fundbridge.authservice.repository;

import com.fundbridge.authservice.entity.LoginAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginAuditRepository extends JpaRepository<LoginAudit, Long> {
}
