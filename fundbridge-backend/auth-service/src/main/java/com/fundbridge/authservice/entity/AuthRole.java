package com.fundbridge.authservice.entity;

import jakarta.persistence.*;

import java.util.Objects;
import java.util.Set;

@Entity
@Table(name = "auth_roles",
        uniqueConstraints = @UniqueConstraint(name = "uq_auth_roles_name", columnNames = "name"))
public class AuthRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private UserRole name;

    @ManyToMany(mappedBy = "roles")
    private Set<UserAccount> users;

    public AuthRole() {
    }

    public AuthRole(UserRole name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserRole getName() {
        return name;
    }

    public void setName(UserRole name) {
        this.name = name;
    }

    public Set<UserAccount> getUsers() {
        return users;
    }

    public void setUsers(Set<UserAccount> users) {
        this.users = users;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AuthRole authRole = (AuthRole) o;
        return name == authRole.name;
    }

    @Override
    public int hashCode() {
        return Objects.hash(name);
    }
}
