package com.fundbridge.authservice.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Entity
@Table(name = "auth_users",
        uniqueConstraints = @UniqueConstraint(name = "uq_auth_users_email", columnNames = "email"))
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 191)
    private String name;

    @Column(nullable = false, unique = true, length = 191)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "is_email_verified", nullable = false)
    private boolean emailVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;

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

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "auth_user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"),
            uniqueConstraints = @UniqueConstraint(name = "pk_auth_user_roles", columnNames = {"user_id", "role_id"})
    )
    private Set<AuthRole> roles = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
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

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
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

    public Set<AuthRole> getRoles() {
        return roles;
    }

    public void setRoles(Set<AuthRole> roles) {
        this.roles = roles;
    }

    public void assignRole(AuthRole role) {
        this.roles = role == null ? new HashSet<>() : new HashSet<>(Set.of(role));
    }

    public UserRole getPrimaryRole() {
        return roles == null ? UserRole.BORROWER :
                roles.stream().map(AuthRole::getName).filter(Objects::nonNull).findFirst().orElse(UserRole.BORROWER);
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
