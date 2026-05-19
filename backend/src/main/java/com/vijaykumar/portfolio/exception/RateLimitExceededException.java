package com.vijaykumar.portfolio.exception;

/**
 * Thrown when a client exceeds the contact form rate limit.
 * Mapped to HTTP 429 by the GlobalExceptionHandler.
 */
public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException(String message) {
        super(message);
    }
}
