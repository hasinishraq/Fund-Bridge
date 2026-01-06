package com.fundbridge.notificationservice.config;

import com.fundbridge.notificationservice.entity.NotificationChannel;
import com.fundbridge.notificationservice.entity.NotificationTemplate;
import com.fundbridge.notificationservice.repository.NotificationTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
public class NotificationTemplateSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(NotificationTemplateSeeder.class);

    private final NotificationTemplateRepository templateRepository;

    public NotificationTemplateSeeder(NotificationTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<TemplateSeed> seeds = defaultSeeds();
        int created = 0;
        for (TemplateSeed seed : seeds) {
            if (templateRepository.existsByTemplateKeyAndChannelAndActiveTrue(seed.templateKey(), seed.channel())) {
                continue;
            }
            int version = nextVersion(seed.templateKey(), seed.channel());
            NotificationTemplate template = new NotificationTemplate();
            template.setTemplateKey(seed.templateKey());
            template.setChannel(seed.channel());
            template.setSubject(seed.subject());
            template.setBody(seed.body());
            template.setVersion(version);
            template.setActive(true);
            templateRepository.save(template);
            created++;
        }
        if (created > 0) {
            log.info("Seeded {} notification templates", created);
        }
    }

    private int nextVersion(String templateKey, NotificationChannel channel) {
        Integer maxVersion = templateRepository.findMaxVersion(templateKey, channel);
        return maxVersion == null ? 1 : maxVersion + 1;
    }

    private List<TemplateSeed> defaultSeeds() {
        List<TemplateSeed> seeds = new ArrayList<>();

        addDefault(seeds, "OTP_EMAIL_VERIFY", "Verify your email",
                "Your verification code is {{otp}}. It expires in {{ttlMinutes}} minutes.");
        addDefault(seeds, "OTP_PASSWORD_RESET", "Reset your password",
                "Your password reset code is {{otp}}. It expires in {{ttlMinutes}} minutes.");
        addDefault(seeds, "OTP_LOGIN_2FA", "Your login code",
                "Your login code is {{otp}}. It expires in {{ttlMinutes}} minutes.");

        addDefault(seeds, "KYC_APPROVED", "KYC approved",
                "Your KYC verification is approved.");
        addDefault(seeds, "KYC_REJECTED", "KYC rejected",
                "Your KYC verification was rejected. Review: {{reviewUrl}}.");

        addDefault(seeds, "WALLET_TOPUP_SUCCESS", "Wallet top-up successful",
                "Your wallet top-up of {{amount}} {{currency}} was successful. Ref: {{txRef}}.");
        addDefault(seeds, "WALLET_TOPUP_FAILED", "Wallet top-up failed",
                "Your wallet top-up of {{amount}} {{currency}} failed. Reason: {{reason}}.");
        addDefault(seeds, "WALLET_TRANSFER_SENT", "Transfer sent",
                "You sent {{amount}} {{currency}}. Ref: {{txRef}}.");
        addDefault(seeds, "WALLET_TRANSFER_RECEIVED", "Transfer received",
                "You received {{amount}} {{currency}}. Ref: {{txRef}}.");
        addDefault(seeds, "WALLET_HOLD_CREATED", "Wallet hold created",
                "A hold of {{amount}} {{currency}} was placed. Ref: {{holdRef}}.");
        addDefault(seeds, "WALLET_HOLD_RELEASED", "Wallet hold released",
                "A hold of {{amount}} {{currency}} was released. Ref: {{holdRef}}.");
        addDefault(seeds, "WALLET_HOLD_CAPTURED", "Wallet hold captured",
                "A hold of {{amount}} {{currency}} was captured. Ref: {{holdRef}}.");

        addDefault(seeds, "LOAN_APPLICATION_SUBMITTED", "Loan application submitted",
                "Your loan application for {{amount}} {{currency}} was submitted.");
        addDefault(seeds, "LOAN_APPROVED", "Loan approved",
                "Your loan for {{amount}} {{currency}} was approved.");
        addDefault(seeds, "LOAN_REJECTED", "Loan rejected",
                "Your loan application for {{amount}} {{currency}} was rejected.");
        addDefault(seeds, "LOAN_DISBURSED", "Loan disbursed",
                "Your loan for {{amount}} {{currency}} was disbursed.");
        addDefault(seeds, "EMI_DUE", "EMI due",
                "Your EMI of {{amount}} {{currency}} is due on {{dueDate}}.");
        addDefault(seeds, "EMI_OVERDUE", "EMI overdue",
                "Your EMI of {{amount}} {{currency}} is overdue since {{dueDate}}.");
        addDefault(seeds, "EMI_PAID", "EMI paid",
                "Your EMI of {{amount}} {{currency}} was paid on {{paidAt}}.");

        return seeds;
    }

    private void addDefault(List<TemplateSeed> seeds, String key, String subject, String body) {
        seeds.add(new TemplateSeed(key, NotificationChannel.INAPP, subject, body));
        seeds.add(new TemplateSeed(key, NotificationChannel.EMAIL, subject, body));
    }

    private record TemplateSeed(String templateKey, NotificationChannel channel, String subject, String body) {
    }
}
