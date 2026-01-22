package com.fundbridge.adminservice.repository;

import com.fundbridge.adminservice.entity.AdminApproval;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminApprovalRepository extends JpaRepository<AdminApproval, Long> {

    List<AdminApproval> findAllByOrderByRequestedAtDesc();
}
