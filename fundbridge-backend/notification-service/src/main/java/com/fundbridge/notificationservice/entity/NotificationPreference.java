package com.fundbridge.notificationservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreference {

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled = true;

    @Column(name = "sms_enabled", nullable = false)
    private boolean smsEnabled = false;

    @Column(name = "inapp_enabled", nullable = false)
    private boolean inappEnabled = true;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public NotificationPreference() {
    }

    public NotificationPreference(Long userId) {
        this.userId = userId;
    }

    public static NotificationPreference defaultFor(Long userId) {
        return new NotificationPreference(userId);
    }

    @PrePersist
    void onCreate() {
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public boolean isEmailEnabled() {
        return emailEnabled;
    }

    public void setEmailEnabled(boolean emailEnabled) {
        this.emailEnabled = emailEnabled;
    }

    public boolean isSmsEnabled() {
        return smsEnabled;
    }

    public void setSmsEnabled(boolean smsEnabled) {
        this.smsEnabled = smsEnabled;
    }

    public boolean isInappEnabled() {
        return inappEnabled;
    }

    public void setInappEnabled(boolean inappEnabled) {
        this.inappEnabled = inappEnabled;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
