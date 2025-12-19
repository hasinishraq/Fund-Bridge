package com.fundbridge.authservice.service;

import com.fundbridge.authservice.entity.LoginAudit;
import com.fundbridge.authservice.entity.UserAccount;
import com.fundbridge.authservice.repository.LoginAuditRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoginAuditService {

    private final LoginAuditRepository loginAuditRepository;

    public LoginAuditService(LoginAuditRepository loginAuditRepository) {
        this.loginAuditRepository = loginAuditRepository;
    }

    @Transactional
    public void record(UserAccount user, String email, boolean success, String failureReason, String ip, String userAgent) {
        LoginAudit audit = new LoginAudit();
        audit.setUser(user);
        audit.setEmail(email);
        audit.setSuccess(success);
        audit.setFailureReason(failureReason);
        audit.setIp(ip);
        audit.setUserAgent(userAgent);
        loginAuditRepository.save(audit);
    }
}
