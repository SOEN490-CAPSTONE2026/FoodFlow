package com.example.foodflow.exception;

/**
 * Custom exception for business logic errors with i18n support.
 * The message key will be resolved from messages_*.properties files.
 */
public class BusinessException extends RuntimeException {

    private final String messageKey;
    private final Object[] args;

    public BusinessException(String messageKey) {
        super(messageKey);
        this.messageKey = messageKey;
        this.args = null;
    }

    public BusinessException(String messageKey, Object... args) {
        super(messageKey);
        this.messageKey = messageKey;
        this.args = args;
    }

    public String getMessageKey() {
        return messageKey;
    }

    public Object[] getArgs() {
        return args;
    }
}

