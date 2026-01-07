package com.fundbridge.notificationservice.exception;

public class MissingRecipientException extends RuntimeException {

    public MissingRecipientException(String message) {
        super(message);
    }
}
