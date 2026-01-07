package com.fundbridge.notificationservice.repository;

import com.fundbridge.notificationservice.entity.NotificationOutbox;
import com.fundbridge.notificationservice.entity.NotificationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface NotificationOutboxRepository extends JpaRepository<NotificationOutbox, Long> {

    Optional<NotificationOutbox> findByIdempotencyKey(String idempotencyKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select n from NotificationOutbox n where n.status = :status and n.scheduledAt <= :now and n.lockedAt is null order by n.scheduledAt asc")
    List<NotificationOutbox> findReadyForProcessing(@Param("status") NotificationStatus status,
                                                    @Param("now") Instant now,
                                                    Pageable pageable);
}
