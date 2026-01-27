package com.fundbridge.adminservice.repository;

import com.fundbridge.adminservice.entity.AdminAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminActionRepository extends JpaRepository<AdminAction, Long> {
    List<AdminAction> findAllByOrderByCreatedAtDesc();

    @Query("select count(distinct a.adminUserId) from AdminAction a")
    long countDistinctAdminUserId();
}
