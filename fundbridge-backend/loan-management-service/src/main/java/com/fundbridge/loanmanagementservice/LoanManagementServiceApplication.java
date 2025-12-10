package com.fundbridge.loanmanagementservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class LoanManagementServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(LoanManagementServiceApplication.class, args);
    }
}
