/* ═══════════════════════════════════════════════════════════
   Portfolio Backend v2.0 — ContactController.java
   Fixes:
   - BUG: @CrossOrigin here AND CorsConfig globally = Spring
     applies both CORS policies; the more restrictive one wins,
     which was the @CrossOrigin annotation with only the old
     vercel URL. This silently blocked the custom domain.
     Fix: remove @CrossOrigin here entirely — let CorsConfig handle it.
   - Added: email notification to you when someone submits the form
═══════════════════════════════════════════════════════════ */
package com.vijaykumar.portfolio.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.vijaykumar.portfolio.dto.ContactRequest;
import com.vijaykumar.portfolio.service.ContactService;
import com.vijaykumar.portfolio.dto.ApiResponse;

/* BUG FIX: @CrossOrigin removed — CORS is handled centrally by CorsConfig.
   Having both causes the stricter annotation-level rule to override the
   global config, blocking your custom domain. */
@RestController
@RequestMapping("/api/v1")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping("/contact")
    public ResponseEntity<ApiResponse> handleContact(
            @Valid @RequestBody ContactRequest request) {

        contactService.saveMessage(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new ApiResponse("SUCCESS", "Message received. I'll reply within 24 hours."));
    }

    @RequestMapping(value = "/health", method = {RequestMethod.GET, RequestMethod.HEAD})
    public ResponseEntity<ApiResponse> health() {
        return ResponseEntity.ok(new ApiResponse("UP", "Portfolio API is operational"));
    }
}