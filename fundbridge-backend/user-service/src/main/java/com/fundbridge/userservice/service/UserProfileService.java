package com.fundbridge.userservice.service;

import com.fundbridge.userservice.dto.UpdateProfileRequest;
import com.fundbridge.userservice.dto.UpdateUserSettingsRequest;
import com.fundbridge.userservice.dto.UserResponse;
import com.fundbridge.userservice.entity.UserAccount;
import com.fundbridge.userservice.entity.UserSettings;
import com.fundbridge.userservice.exception.ResourceConflictException;
import com.fundbridge.userservice.exception.ResourceNotFoundException;
import com.fundbridge.userservice.mapper.UserMapper;
import com.fundbridge.userservice.repository.UserAccountRepository;
import com.fundbridge.userservice.security.UserPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class UserProfileService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileService(UserAccountRepository userAccountRepository,
                              PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse getProfile(UserPrincipal principal) {
        return UserMapper.toResponse(findOrThrow(principal.getUser().getId()));
    }

    @Transactional
    public UserResponse updateProfile(UserPrincipal principal, UpdateProfileRequest request) {
        UserAccount user = findOrThrow(principal.getUser().getId());

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

        return UserMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateSettings(UserPrincipal principal, UpdateUserSettingsRequest request) {
        UserAccount user = findOrThrow(principal.getUser().getId());
        UserSettings settings = user.getSettings();
        if (settings == null) {
            settings = new UserSettings();
            user.setSettings(settings);
        }

        if (request.locale() != null && !request.locale().isBlank()) {
            settings.setLocale(request.locale().trim());
        }
        if (request.emailNotifications() != null) {
            settings.setEmailNotifications(request.emailNotifications());
        }
        if (request.smsNotifications() != null) {
            settings.setSmsNotifications(request.smsNotifications());
        }

        return UserMapper.toResponse(user);
    }

    private UserAccount findOrThrow(Long id) {
        return userAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.US);
    }
}
