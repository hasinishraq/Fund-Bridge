package com.fundbridge.authservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class UserSettings {

    @Column(name = "settings_locale", length = 12)
    private String locale = "en";

    @Column(name = "settings_email_notifications")
    private boolean emailNotifications = true;

    @Column(name = "settings_sms_notifications")
    private boolean smsNotifications = false;

    public String getLocale() {
        return locale;
    }

    public void setLocale(String locale) {
        this.locale = locale;
    }

    public boolean isEmailNotifications() {
        return emailNotifications;
    }

    public void setEmailNotifications(boolean emailNotifications) {
        this.emailNotifications = emailNotifications;
    }

    public boolean isSmsNotifications() {
        return smsNotifications;
    }

    public void setSmsNotifications(boolean smsNotifications) {
        this.smsNotifications = smsNotifications;
    }
}
