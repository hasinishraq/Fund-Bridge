package com.fundbridge.authservice.kyc.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(SumsubProperties.class)
public class KycConfig {
}
