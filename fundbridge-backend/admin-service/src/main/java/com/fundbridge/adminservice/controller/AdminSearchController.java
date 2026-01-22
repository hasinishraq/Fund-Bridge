package com.fundbridge.adminservice.controller;

import com.fundbridge.adminservice.dto.AdminSearchResponse;
import com.fundbridge.adminservice.service.AdminSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/search")
@Validated
public class AdminSearchController {

    private final AdminSearchService searchService;

    public AdminSearchController(AdminSearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public ResponseEntity<AdminSearchResponse> search(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "query", required = false) String query) {
        String normalized = q != null ? q : query;
        return ResponseEntity.ok(searchService.search(normalized));
    }
}
