package com.fundbridge.adminservice.repository;

import com.fundbridge.adminservice.entity.AdminRiskEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminRiskEventRepository extends JpaRepository<AdminRiskEvent, Long> {

    List<AdminRiskEvent> findAllByOrderByCreatedAtDesc();
}
