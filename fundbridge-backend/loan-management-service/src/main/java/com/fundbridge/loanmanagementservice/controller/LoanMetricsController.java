package com.fundbridge.loanmanagementservice.controller;

import com.fundbridge.loanmanagementservice.dto.LoanMetricsResponse;
import com.fundbridge.loanmanagementservice.service.LoanMetricsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/loans/metrics")
@Validated
public class LoanMetricsController {

    private final LoanMetricsService metricsService;

    public LoanMetricsController(LoanMetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping
    public ResponseEntity<LoanMetricsResponse> getMetrics(
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(metricsService.getMetrics(date));
    }
}
