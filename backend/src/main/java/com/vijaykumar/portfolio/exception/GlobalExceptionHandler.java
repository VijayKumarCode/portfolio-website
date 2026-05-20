package com.vijaykumar.portfolio.exception;

import com.vijaykumar.portfolio.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * GlobalExceptionHandler — centralised error responses.
 *
 * Converts Spring's validation exceptions and runtime errors into
 * consistent JSON bodies that the frontend can parse reliably:
 *
 * { "status": "error", "message": "...", "timestamp": "...", "errors": [...] }
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles @Valid validation failures on @RequestBody.
     * Returns all field errors in a structured list.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<Map<String, String>> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(err -> {
                Map<String, String> m = new LinkedHashMap<>();
                m.put("field", err.getField());
                m.put("message", err.getDefaultMessage());
                return m;
            })
            .collect(Collectors.toList());

        log.warn("Validation failed — {} field error(s)", errors.size());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "error");
        body.put("message", "Validation failed");
        body.put("errors", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            new ApiResponse("error", "Validation failed")
        );
    }

    /**
     * Rate limit exceeded — HTTP 429.
     */
    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ApiResponse> handleRateLimit(RateLimitExceededException ex) {
        log.warn("Rate limit exceeded — {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .body(new ApiResponse("error", ex.getMessage()));
    }

    /**
     * Email delivery failed — both providers exhausted.
     * Returns 502 Bad Gateway to signal upstream provider failure.
     */
    @ExceptionHandler(EmailDeliveryException.class)
    public ResponseEntity<ApiResponse> handleEmailFailure(EmailDeliveryException ex) {
        log.error("Email delivery failed — {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .body(new ApiResponse("error",
                "Message saved but notification could not be sent. Please try again later."));
    }

    /**
     * Catch-all for unexpected runtime exceptions.
     * Never leaks stack traces to the client in production.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception — {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ApiResponse("error", "An unexpected error occurred. Please try again later."));
    }
}
