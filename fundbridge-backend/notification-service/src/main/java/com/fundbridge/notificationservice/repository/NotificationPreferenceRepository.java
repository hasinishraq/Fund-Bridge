package com.fundbridge.notificationservice.repository;

import com.fundbridge.notificationservice.entity.NotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {
}
