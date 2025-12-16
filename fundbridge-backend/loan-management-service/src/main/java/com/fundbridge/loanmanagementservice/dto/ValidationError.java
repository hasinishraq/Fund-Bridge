package com.fundbridge.loanmanagementservice.dto;

public record ValidationError(
        String field,
        String message
) {
}
