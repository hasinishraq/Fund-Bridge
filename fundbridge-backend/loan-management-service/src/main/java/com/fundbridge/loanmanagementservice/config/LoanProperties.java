package com.fundbridge.loanmanagementservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@ConfigurationProperties(prefix = "loan")
public class LoanProperties {

    private String defaultCurrency = "BDT";
    private BigDecimal defaultInterestRatePercent = BigDecimal.valueOf(12);
    private Demo demo = new Demo();

    public String getDefaultCurrency() {
        return defaultCurrency;
    }

    public void setDefaultCurrency(String defaultCurrency) {
        this.defaultCurrency = defaultCurrency;
    }

    public BigDecimal getDefaultInterestRatePercent() {
        return defaultInterestRatePercent;
    }

    public void setDefaultInterestRatePercent(BigDecimal defaultInterestRatePercent) {
        this.defaultInterestRatePercent = defaultInterestRatePercent;
    }

    public Demo getDemo() {
        return demo;
    }

    public void setDemo(Demo demo) {
        this.demo = demo;
    }

    public static class Demo {
        private Long borrowerId = 1L;
        private Long lenderId = 2L;

        public Long getBorrowerId() {
            return borrowerId;
        }

        public void setBorrowerId(Long borrowerId) {
            this.borrowerId = borrowerId;
        }

        public Long getLenderId() {
            return lenderId;
        }

        public void setLenderId(Long lenderId) {
            this.lenderId = lenderId;
        }
    }
}
