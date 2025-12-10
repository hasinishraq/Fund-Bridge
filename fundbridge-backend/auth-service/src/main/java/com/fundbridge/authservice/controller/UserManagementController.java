package com.fundbridge.authservice.controller;

import com.fundbridge.authservice.dto.CreateUserRequest;
import com.fundbridge.authservice.dto.KycUpdateRequest;
import com.fundbridge.authservice.dto.UpdateUserRequest;
import com.fundbridge.authservice.dto.UserResponse;
import com.fundbridge.authservice.entity.KycStatus;
import com.fundbridge.authservice.entity.UserRole;
import com.fundbridge.authservice.service.UserManagementService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/users", "/admin/users"})
@Validated
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final UserManagementService userManagementService;

    public UserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userManagementService.createUser(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userManagementService.getUser(id));
    }

    @GetMapping
    public ResponseEntity<Page<UserResponse>> listUsers(@RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "20") int size,
                                                        @RequestParam(required = false) UserRole role,
                                                        @RequestParam(required = false) KycStatus status) {
        int resolvedPage = Math.max(page, 0);
        int resolvedSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(resolvedPage, resolvedSize);
        Page<UserResponse> response = userManagementService.listUsers(role, status, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/email")
    public ResponseEntity<UserResponse> getUserByEmail(@RequestParam @NotBlank @Email String email) {
        return ResponseEntity.ok(userManagementService.getUserByEmail(email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id,
                                                   @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userManagementService.updateUser(id, request));
    }

    @PatchMapping("/{id}/kyc")
    public ResponseEntity<UserResponse> updateKyc(@PathVariable Long id,
                                                  @Valid @RequestBody KycUpdateRequest request) {
        return ResponseEntity.ok(userManagementService.updateKyc(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userManagementService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
