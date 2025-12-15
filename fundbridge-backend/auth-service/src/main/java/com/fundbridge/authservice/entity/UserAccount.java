package com.fundbridge.authservice.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "users")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 191)
    private String email;

    @Column(nullable = false, length = 120)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private UserRole role = UserRole.BORROWER;

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", nullable = false, length = 32)
    private KycStatus kycStatus = KycStatus.PENDING;

    @Column(name = "kyc_applicant_id", length = 96)
    private String kycApplicantId;

    @Column(name = "kyc_review_url", length = 1024)
    private String kycReviewUrl;

    @Column(name = "kyc_last_synced_at")
    private Instant kycLastSyncedAt;

    @Embedded
    private UserSettings settings = new UserSettings();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (settings == null) {
            settings = new UserSettings();
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
        if (settings == null) {
            settings = new UserSettings();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public KycStatus getKycStatus() {
        return kycStatus;
    }

    public void setKycStatus(KycStatus kycStatus) {
        this.kycStatus = kycStatus;
    }

    public String getKycApplicantId() {
        return kycApplicantId;
    }

    public void setKycApplicantId(String kycApplicantId) {
        this.kycApplicantId = kycApplicantId;
    }

    public String getKycReviewUrl() {
        return kycReviewUrl;
    }

    public void setKycReviewUrl(String kycReviewUrl) {
        this.kycReviewUrl = kycReviewUrl;
    }

    public Instant getKycLastSyncedAt() {
        return kycLastSyncedAt;
    }

    public void setKycLastSyncedAt(Instant kycLastSyncedAt) {
        this.kycLastSyncedAt = kycLastSyncedAt;
    }

    public UserSettings getSettings() {
        return settings;
    }

    public void setSettings(UserSettings settings) {
        this.settings = settings;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
