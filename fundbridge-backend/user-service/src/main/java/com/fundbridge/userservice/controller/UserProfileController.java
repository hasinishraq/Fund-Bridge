package com.fundbridge.userservice.controller;

import com.fundbridge.userservice.dto.UpdateProfileRequest;
import com.fundbridge.userservice.dto.UpdateUserSettingsRequest;
import com.fundbridge.userservice.dto.UserResponse;
import com.fundbridge.userservice.security.UserPrincipal;
import com.fundbridge.userservice.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/profile", "/users/me"})
@PreAuthorize("hasAnyRole('ADMIN','BORROWER','LENDER')")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping
    public ResponseEntity<UserResponse> profile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userProfileService.getProfile(principal));
    }

    @PutMapping
    public ResponseEntity<UserResponse> updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                                      @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userProfileService.updateProfile(principal, request));
    }

    @PatchMapping("/settings")
    public ResponseEntity<UserResponse> updateSettings(@AuthenticationPrincipal UserPrincipal principal,
                                                       @Valid @RequestBody UpdateUserSettingsRequest request) {
        return ResponseEntity.ok(userProfileService.updateSettings(principal, request));
    }
}
