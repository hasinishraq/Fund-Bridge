package com.fundbridge.creditscoreservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class CreditScoreServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(CreditScoreServiceApplication.class, args);
    }
}
