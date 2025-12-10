package com.fundbridge.loanmanagementservice.service;

import com.fundbridge.loanmanagementservice.dto.EmiScheduleItem;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class EmiCalculatorService {

    private static final MathContext MC = new MathContext(12, RoundingMode.HALF_UP);

    public BigDecimal calculateEmi(BigDecimal principal, BigDecimal annualRatePercent, int termMonths) {
        BigDecimal monthlyRate = annualRatePercent.divide(BigDecimal.valueOf(1200), MC); // rate/12/100
        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(termMonths), MC).setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal onePlusRPowerN = monthlyRate.add(BigDecimal.ONE).pow(termMonths, MC);
        BigDecimal numerator = principal.multiply(monthlyRate, MC).multiply(onePlusRPowerN, MC);
        BigDecimal denominator = onePlusRPowerN.subtract(BigDecimal.ONE, MC);
        return numerator.divide(denominator, MC).setScale(2, RoundingMode.HALF_UP);
    }

    public List<EmiScheduleItem> buildSchedule(BigDecimal principal, BigDecimal annualRatePercent, int termMonths) {
        BigDecimal monthlyRate = annualRatePercent.divide(BigDecimal.valueOf(1200), MC);
        BigDecimal emi = calculateEmi(principal, annualRatePercent, termMonths);
        List<EmiScheduleItem> schedule = new ArrayList<>(termMonths);
        BigDecimal remaining = principal;
        LocalDate dueDate = LocalDate.now().plusMonths(1);

        for (int installment = 1; installment <= termMonths; installment++) {
            BigDecimal interestComponent = remaining.multiply(monthlyRate, MC).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalComponent = emi.subtract(interestComponent, MC).setScale(2, RoundingMode.HALF_UP);
            remaining = remaining.subtract(principalComponent, MC).max(BigDecimal.ZERO);
            schedule.add(new EmiScheduleItem(
                    installment,
                    dueDate,
                    principalComponent,
                    interestComponent,
                    emi,
                    remaining.setScale(2, RoundingMode.HALF_UP)
            ));
            dueDate = dueDate.plusMonths(1);
        }

        return schedule;
    }
}
