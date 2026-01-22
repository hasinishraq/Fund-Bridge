package com.fundbridge.adminservice.controller;

import com.fundbridge.adminservice.dto.AdminRiskEventResponse;
import com.fundbridge.adminservice.dto.CreateAdminRiskEventRequest;
import com.fundbridge.adminservice.service.AdminRiskEventService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/risk-events")
@Validated
public class AdminRiskEventController {

    private final AdminRiskEventService riskEventService;

    public AdminRiskEventController(AdminRiskEventService riskEventService) {
        this.riskEventService = riskEventService;
    }

    @PostMapping
    public ResponseEntity<AdminRiskEventResponse> createEvent(@Valid @RequestBody CreateAdminRiskEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(riskEventService.createEvent(request));
    }

    @GetMapping
    public ResponseEntity<List<AdminRiskEventResponse>> listEvents(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "gateway", required = false) String gateway,
            @RequestParam(value = "minRiskScore", required = false) Integer minRiskScore,
            @RequestParam(value = "dateFrom", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(value = "dateTo", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(value = "query", required = false) String query) {
        return ResponseEntity.ok(riskEventService.listEvents(status, gateway, minRiskScore, dateFrom, dateTo, query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminRiskEventResponse> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(riskEventService.getEvent(id));
    }
}
