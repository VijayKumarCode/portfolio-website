package com.vijaykumar.portfolio.exception;

/**
 * Dedicated exception for email delivery failures.
 * Allows the GlobalExceptionHandler to return a 502/503
 * when the primary and fallback providers both fail.
 */
public class EmailDeliveryException extends RuntimeException {

    public EmailDeliveryException(String message) {
        super(message);
    }

    public EmailDeliveryException(String message, Throwable cause) {
        super(message, cause);
    }
}
