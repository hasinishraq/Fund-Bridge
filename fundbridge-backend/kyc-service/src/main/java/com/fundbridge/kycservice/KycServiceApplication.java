package com.fundbridge.kycservice;

import com.fundbridge.kycservice.config.SumsubProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
@EnableConfigurationProperties(SumsubProperties.class)
public class KycServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(KycServiceApplication.class, args);
    }
}
