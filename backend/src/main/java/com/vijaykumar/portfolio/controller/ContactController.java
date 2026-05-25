package com.vijaykumar.portfolio.controller;

import com.vijaykumar.portfolio.dto.ApiResponse;
import com.vijaykumar.portfolio.dto.ContactFormDto;
import com.vijaykumar.portfolio.entity.ContactMessage;
import com.vijaykumar.portfolio.service.ContactService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contact Controller — REST API endpoint for contact form submissions
 * 
 * ENDPOINT: POST /api/contact
 * 
 * FEATURES:
 * - Input validation via @Valid (returns 400 with clear messages)
 * - Fast response (DB save is synchronous, email is async)
 * - Security: No sensitive data in response
 * - Rate limiting: Should be added at Render level or via Bucket4j
 * 
 * RESPONSE CODES:
 * - 201 Created: Message saved and email triggered
 * - 400 Bad Request: Validation failed (missing/invalid fields)
 * - 429 Too Many Requests: Rate limited (if rate limiter configured)
 * - 500 Internal Server Error: Unexpected server error
 */
@RestController
@RequestMapping("/api/v1/contact")
public class ContactController {

    private static final Logger log = LoggerFactory.getLogger(ContactController.class);

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    /**
     * Submits a contact form.
     * 
     * The email notification is sent asynchronously — this endpoint returns
     * as soon as the message is saved to the database (typically < 200ms).
     * 
     * @param dto The contact form data (validated automatically)
     * @return 201 Created with success message
     */
    @PostMapping
    public ResponseEntity<ApiResponse> submitContactForm(
            @Valid @RequestBody ContactFormDto dto) {
        
        log.info("Contact form received from: [REDACTED]");
        
        try {
            // Save to database (synchronous — must succeed)
            contactService.processContactForm(dto);
            
            // Return success — email is being sent asynchronously
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse("success", "Thank you for your message. I'll get back to you soon!"));
            
        } catch (IllegalArgumentException e) {
            // Validation error (from our service-level validation)
            log.warn("Contact form validation failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse("error", e.getMessage()));
            
        } catch (Exception e) {
            // Unexpected error
            log.error("Contact form processing failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse("error", "An unexpected error occurred. Please try again later."));
        }
    }

    /**
     * GET endpoint for testing connectivity.
     * Returns 200 OK to verify the API is reachable.
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse> healthCheck() {
        return ResponseEntity.ok(new ApiResponse("success", "contact-api is reachable"));
    }
}
