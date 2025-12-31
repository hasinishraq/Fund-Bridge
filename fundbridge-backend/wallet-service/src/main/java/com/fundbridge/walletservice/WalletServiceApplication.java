package com.fundbridge.walletservice;

import com.fundbridge.walletservice.config.StorageProperties;
import com.fundbridge.walletservice.config.StripeProperties;
import com.fundbridge.walletservice.config.WalletProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
@EnableConfigurationProperties({StorageProperties.class, WalletProperties.class, StripeProperties.class})
public class WalletServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(WalletServiceApplication.class, args);
    }
}
