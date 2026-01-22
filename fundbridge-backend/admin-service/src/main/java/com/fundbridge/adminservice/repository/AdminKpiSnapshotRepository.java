package com.fundbridge.adminservice.repository;

import com.fundbridge.adminservice.entity.AdminKpiSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdminKpiSnapshotRepository extends JpaRepository<AdminKpiSnapshot, Long> {

    List<AdminKpiSnapshot> findAllByOrderByCreatedAtDesc();

    Optional<AdminKpiSnapshot> findTopByOrderByCreatedAtDesc();
}
