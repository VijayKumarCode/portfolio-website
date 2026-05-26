package com.vijaykumar.portfolio.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

/**
 * Global Exception Handler — Centralized error handling for all controllers
 * 
 * PROBLEM: Validation errors throw MethodArgumentNotValidException which
 * results in a messy 500 error with stack trace.
 * 
 * FIX: This handler catches validation errors and returns clean 400 responses
 * with field-specific error messages.
 * 
 * Also catches generic exceptions to prevent stack traces from leaking to clients.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles @Valid validation failures (Jakarta Bean Validation).
     * Returns 400 Bad Request with field-specific error messages.
     */
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
        response.put("success", false);
        response.put("error", "Validation failed");
        response.put("fieldErrors", fieldErrors);
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handles IllegalArgumentException from service layer validation.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Catch-all for unexpected exceptions.
     * Prevents stack traces from being exposed to clients.
     */

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResourceFoundException(NoResourceFoundException ex) {
        log.info("Route or static resource not found: {}", ex.getResourcePath());

        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", "The requested resource or endpoint could not be found.");
        response.put("path", ex.getResourcePath());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", "An unexpected error occurred. Please try again later.");
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
