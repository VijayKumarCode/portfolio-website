package com.vijaykumar.portfolio.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Contact Form DTO — Data Transfer Object for contact form submissions
 * 
 * Uses Jakarta Bean Validation annotations for automatic validation.
 * The @Valid annotation in the controller triggers these checks.
 * 
 * This class is immutable (record) for thread safety and predictability.
 * Jackson can deserialize records without issues in Spring Boot 3+.
 */
public record ContactFormDto(
    
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be less than 100 characters")
    String name,
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 254, message = "Email must be less than 254 characters")
    String email,
    
    @NotBlank(message = "Subject is required")
    @Size(max = 200, message = "Subject must be less than 200 characters")
    String subject,
    
    @NotBlank(message = "Message is required")
    @Size(max = 5000, message = "Message must be less than 5000 characters")
    String message
) {
    // Compact canonical constructor for additional sanitization
    public ContactFormDto {
        // Trim all string fields to prevent whitespace-only input
        name = name != null ? name.trim() : null;
        email = email != null ? email.trim().toLowerCase() : null;
        subject = subject != null ? subject.trim() : null;
        message = message != null ? message.trim() : null;
    }
}
