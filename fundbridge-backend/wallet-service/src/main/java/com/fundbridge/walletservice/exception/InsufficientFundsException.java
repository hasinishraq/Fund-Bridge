package com.fundbridge.walletservice.exception;

import java.math.BigDecimal;

public class InsufficientFundsException extends RuntimeException {
    public InsufficientFundsException(BigDecimal requested, BigDecimal available) {
        super("Insufficient funds. Requested " + requested + " but only " + available + " available");
    }
}
