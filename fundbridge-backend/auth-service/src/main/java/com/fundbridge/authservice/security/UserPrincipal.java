package com.fundbridge.authservice.security;

import com.fundbridge.authservice.entity.UserAccount;
import com.fundbridge.authservice.entity.UserRole;
import com.fundbridge.authservice.entity.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class UserPrincipal implements UserDetails {

    private final UserAccount user;

    private UserPrincipal(UserAccount user) {
        this.user = user;
    }

    public static UserPrincipal from(UserAccount user) {
        return new UserPrincipal(user);
    }

    public UserAccount getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return List.of(new SimpleGrantedAuthority("ROLE_" + user.getPrimaryRole().name()));
        }
        return user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName().name()))
                .collect(Collectors.toSet());
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return user.getStatus() != UserStatus.LOCKED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return user.getStatus() != UserStatus.DISABLED;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserPrincipal that = (UserPrincipal) o;
        return Objects.equals(user.getId(), that.user.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(user.getId());
    }
}
