package com.fundbridge.authservice.service;

import com.fundbridge.authservice.dto.AuthResponse;
import com.fundbridge.authservice.dto.LoginRequest;
import com.fundbridge.authservice.dto.RegisterRequest;
import com.fundbridge.authservice.dto.UserResponse;
import com.fundbridge.authservice.entity.UserAccount;
import com.fundbridge.authservice.entity.UserRole;
import com.fundbridge.authservice.exception.ResourceConflictException;
import com.fundbridge.authservice.mapper.UserMapper;
import com.fundbridge.authservice.security.JwtService;
import com.fundbridge.authservice.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserService userService,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.US);
        if (userService.existsByEmail(normalizedEmail)) {
            throw new ResourceConflictException("Email already registered");
        }

        UserAccount userAccount = new UserAccount();
        userAccount.setName(request.name().trim());
        userAccount.setEmail(normalizedEmail);
        userAccount.setPassword(passwordEncoder.encode(request.password()));
        userAccount.setRole(UserRole.BORROWER);

        UserAccount saved = userService.save(userAccount);
        UserPrincipal principal = UserPrincipal.from(saved);
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, UserMapper.toResponse(saved));
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.US);
        var authenticationToken = new UsernamePasswordAuthenticationToken(
                normalizedEmail, request.password()
        );
        var authentication = authenticationManager.authenticate(authenticationToken);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, UserMapper.toResponse(principal.getUser()));
    }

    public UserResponse currentUser(UserPrincipal principal) {
        if (principal == null) {
            throw new IllegalStateException("No authenticated user in context");
        }
        return UserMapper.toResponse(principal.getUser());
    }
}
