package com.fundbridge.adminservice.repository;

import com.fundbridge.adminservice.entity.AdminAlert;
import com.fundbridge.adminservice.entity.AdminAlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminAlertRepository extends JpaRepository<AdminAlert, Long> {

    List<AdminAlert> findAllByOrderByCreatedAtDesc();

    long countByStatus(AdminAlertStatus status);
}
