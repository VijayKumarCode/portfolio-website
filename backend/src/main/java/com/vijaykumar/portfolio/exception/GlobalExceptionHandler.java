package com.vijaykumar.portfolio.exception;

import com.vijaykumar.portfolio.dto.ApiResponse;
import org.hibernate.exception.GenericJDBCException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("success", false);
        response.put("error", "Validation failed");
        response.put("message", "Validation failed: " + String.join(", ", fieldErrors.values()));
        response.put("fieldErrors", fieldErrors);
        response.put("timestamp", java.time.Instant.now().toString());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse("error", ex.getMessage()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResourceFoundException(NoResourceFoundException ex) {
        log.info("Route or static resource not found: {}", ex.getResourcePath());

        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("success", false);
        response.put("error", "The requested resource or endpoint could not be found.");
        response.put("message", "The requested resource could not be found.");
        response.put("path", ex.getResourcePath());
        response.put("timestamp", java.time.Instant.now().toString());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }
    
    /**
     * Handles database schema-related errors (missing columns, etc.).
     * These indicate production deployment issues that require immediate attention.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Unknown database error";
        
        // Check for schema mismatch errors (e.g., "column does not exist")
        if (message.contains("column") && message.contains("does not exist")) {
            log.error("CRITICAL: Database schema mismatch detected - missing column in production: {}", message);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse("error", "Service configuration error. Administrators have been notified."));
        }
        
        // Check for constraint violations
        if (message.contains("constraint") || message.contains("unique")) {
            log.warn("Data constraint violation: {}", message);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse("error", "This submission conflicts with existing data. Please try again."));
        }
        
        log.error("Data integrity violation: {}", message, ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse("error", "An unexpected error occurred. Please try again later."));
    }

    /**
     * Handles lower-level JDBC/Hibernate errors.
     * Useful for catching schema mismatches before DataIntegrityViolation wraps them.
     */
    @ExceptionHandler(GenericJDBCException.class)
    public ResponseEntity<ApiResponse> handleGenericJDBCException(GenericJDBCException ex) {
        Throwable cause = ex.getCause();
        String causeMessage = cause != null ? cause.getMessage() : "Unknown JDBC error";
        
        // Check for PostgreSQL "column does not exist" error (SQLSTATE: 42703)
        if (causeMessage.contains("column") && causeMessage.contains("does not exist")) {
            log.error("CRITICAL: PostgreSQL column does not exist - schema migration needed: {}", causeMessage);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse("error", "Service is temporarily unavailable. Administrators have been notified."));
        }
        
        log.error("JDBC error: {}", causeMessage, ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse("error", "An unexpected error occurred. Please try again later."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleGenericException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse("error", "An unexpected error occurred. Please try again later."));
    }
}
