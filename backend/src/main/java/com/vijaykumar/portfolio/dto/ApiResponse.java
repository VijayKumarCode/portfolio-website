package com.vijaykumar.portfolio.dto;

import java.time.Instant;

/**
 * Standard API response envelope used across all endpoints.
 *
 * Includes a server-generated timestamp so the frontend can
 * detect stale responses and for debugging request timing.
 */
public record ApiResponse(
    String status,
    String message,
    Instant timestamp
) {
    public ApiResponse(String status, String message) {
        this(status, message, Instant.now());
    }
}
