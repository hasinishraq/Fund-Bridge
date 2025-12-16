package com.fundbridge.walletservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "wallet")
public class WalletProperties {

    private String defaultCurrency = "BDT";
    private Long demoUserId = 1L;

    public String getDefaultCurrency() {
        return defaultCurrency;
    }

    public void setDefaultCurrency(String defaultCurrency) {
        this.defaultCurrency = defaultCurrency;
    }

    public Long getDemoUserId() {
        return demoUserId;
    }

    public void setDemoUserId(Long demoUserId) {
        this.demoUserId = demoUserId;
    }
}
