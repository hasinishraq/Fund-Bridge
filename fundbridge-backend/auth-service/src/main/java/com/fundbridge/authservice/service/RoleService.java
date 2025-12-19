package com.fundbridge.authservice.service;

import com.fundbridge.authservice.entity.AuthRole;
import com.fundbridge.authservice.entity.UserRole;
import com.fundbridge.authservice.repository.AuthRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;

@Service
public class RoleService {

    private static final Logger log = LoggerFactory.getLogger(RoleService.class);

    private final AuthRoleRepository authRoleRepository;

    public RoleService(AuthRoleRepository authRoleRepository) {
        this.authRoleRepository = authRoleRepository;
    }

    @PostConstruct
    public void ensureDefaultRoles() {
        for (UserRole role : UserRole.values()) {
            authRoleRepository.findByName(role).orElseGet(() -> {
                log.info("Seeding missing role {}", role);
                return authRoleRepository.save(new AuthRole(role));
            });
        }
    }

    @Transactional(readOnly = true)
    public AuthRole getRole(UserRole role) {
        return authRoleRepository.findByName(role)
                .orElseThrow(() -> new IllegalStateException("Role not found: " + role));
    }
}
