package com.fundbridge.loanmanagementservice.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmiScheduleItem(
        int installment,
        LocalDate dueDate,
        BigDecimal principalComponent,
        BigDecimal interestComponent,
        BigDecimal totalPayment,
        BigDecimal remainingPrincipal
) {
}
