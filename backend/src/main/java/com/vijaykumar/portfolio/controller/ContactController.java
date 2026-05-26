package com.vijaykumar.portfolio.controller;

import com.vijaykumar.portfolio.dto.ApiResponse;
import com.vijaykumar.portfolio.dto.ContactFormDto;
import com.vijaykumar.portfolio.service.ContactService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Contact Controller — REST API engine for incoming contact inquiries
 * * ENDPOINT: POST /api/v1/contact
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
     * Accepts and processes incoming contact form payloads.
     * Core logging statements comply safely with data filtering practices.
     */
    @PostMapping
    public ResponseEntity<ApiResponse> submitContactForm(
            @Valid @RequestBody ContactFormDto dto) {
        
        log.info("Processing secure contact form transaction event");
        
        try {
            contactService.processContactForm(dto);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse("success", "Thank you for your message. I'll get back to you soon!"));
            
        } catch (IllegalArgumentException e) {
            log.warn("Contact submission rejected due to validation constraints: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse("error", e.getMessage()));
            
        } catch (Exception e) {
            log.error("Unhandled infrastructure exception processing form data: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse("error", "An unexpected error occurred. Please try again later."));
        }
    }

    /**
     * Isolated diagnostic check to verify operational visibility of the Contact module.
     * Maps to GET /api/v1/contact/status
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse> apiStatusCheck() {
        return ResponseEntity.ok(new ApiResponse("success", "contact-api submodule is reachable"));
    }
}