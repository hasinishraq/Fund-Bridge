package com.fundbridge.notificationservice.repository;

import com.fundbridge.notificationservice.entity.InAppNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InAppNotificationRepository extends JpaRepository<InAppNotification, Long> {

    List<InAppNotification> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);

    List<InAppNotification> findByUserIdAndReadAtIsNullAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);

    Optional<InAppNotification> findByIdAndUserId(Long id, Long userId);
}
