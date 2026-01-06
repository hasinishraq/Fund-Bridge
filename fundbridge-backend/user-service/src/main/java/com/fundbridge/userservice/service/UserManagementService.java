package com.fundbridge.userservice.service;

import com.fundbridge.userservice.dto.CreateUserRequest;
import com.fundbridge.userservice.dto.KycUpdateRequest;
import com.fundbridge.userservice.dto.UpdateUserRequest;
import com.fundbridge.userservice.dto.UserResponse;
import com.fundbridge.userservice.entity.KycStatus;
import com.fundbridge.userservice.entity.UserAccount;
import com.fundbridge.userservice.entity.UserRole;
import com.fundbridge.userservice.entity.UserSettings;
import com.fundbridge.userservice.exception.ResourceConflictException;
import com.fundbridge.userservice.exception.ResourceNotFoundException;
import com.fundbridge.userservice.mapper.UserMapper;
import com.fundbridge.userservice.repository.UserAccountRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class UserManagementService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserNotificationService userNotificationService;

    public UserManagementService(UserAccountRepository userAccountRepository,
                                 PasswordEncoder passwordEncoder,
                                 UserNotificationService userNotificationService) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.userNotificationService = userNotificationService;
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (userAccountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResourceConflictException("Email already registered");
        }

        UserAccount user = new UserAccount();
        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(request.role() == null ? UserRole.BORROWER : request.role());
        if (user.getSettings() == null) {
            user.setSettings(new UserSettings());
        }

        UserAccount saved = userAccountRepository.save(user);
        return UserMapper.toResponse(saved);
    }

    public UserResponse getUser(Long id) {
        return UserMapper.toResponse(findUserOrThrow(id));
    }

    public UserResponse getUserByEmail(String email) {
        return userAccountRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .map(UserMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public Page<UserResponse> listUsers(UserRole role, KycStatus status, Pageable pageable) {
        Page<UserAccount> users;
        if (role != null && status != null) {
            users = userAccountRepository.findByRoleAndKycStatus(role, status, pageable);
        } else if (role != null) {
            users = userAccountRepository.findByRole(role, pageable);
        } else if (status != null) {
            users = userAccountRepository.findByKycStatus(status, pageable);
        } else {
            users = userAccountRepository.findAll(pageable);
        }
        return users.map(UserMapper::toResponse);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        UserAccount user = findUserOrThrow(id);

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name().trim());
        }

        if (request.email() != null && !request.email().isBlank()) {
            String normalizedEmail = normalizeEmail(request.email());
            if (!normalizedEmail.equalsIgnoreCase(user.getEmail())
                    && userAccountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                throw new ResourceConflictException("Email already registered");
            }
            user.setEmail(normalizedEmail);
        }

        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        if (request.role() != null) {
            user.setRole(request.role());
        }

        return UserMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateKyc(Long id, KycUpdateRequest request) {
        UserAccount user = findUserOrThrow(id);
        KycStatus previousStatus = user.getKycStatus();
        if (request.status() != null) {
            user.setKycStatus(request.status());
        }
        if (request.applicantId() != null) {
            user.setKycApplicantId(request.applicantId().trim());
        }
        if (request.reviewUrl() != null) {
            user.setKycReviewUrl(request.reviewUrl().trim());
        }
        user.setKycLastSyncedAt(Instant.now());
        if (request.status() != null && request.status() != previousStatus) {
            userNotificationService.notifyKycStatus(user, request.status());
        }
        return UserMapper.toResponse(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        UserAccount user = findUserOrThrow(id);
        userAccountRepository.delete(user);
    }

    private UserAccount findUserOrThrow(Long id) {
        return userAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.US);
    }
}
