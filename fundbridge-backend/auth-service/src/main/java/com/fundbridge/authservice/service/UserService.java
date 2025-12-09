package com.fundbridge.authservice.service;

import com.fundbridge.authservice.entity.UserAccount;
import com.fundbridge.authservice.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserAccountRepository userAccountRepository;

    public UserService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    public Optional<UserAccount> findByEmail(String email) {
        return userAccountRepository.findByEmailIgnoreCase(email);
    }

    public boolean existsByEmail(String email) {
        return userAccountRepository.existsByEmailIgnoreCase(email);
    }

    @Transactional
    public UserAccount save(UserAccount userAccount) {
        return userAccountRepository.save(userAccount);
    }
}
