/* ═══════════════════════════════════════════════════════════
   Portfolio Backend v2.0 — ContactController.java
   Fixes:
   - BUG: @CrossOrigin here AND CorsConfig globally = Spring
     applies both CORS policies; the more restrictive one wins,
     which was the @CrossOrigin annotation with only the old
     vercel URL. This silently blocked the custom domain.
     Fix: remove @CrossOrigin here entirely — let CorsConfig handle it.
   - Added: simple in-memory rate limiting (1 contact per 60s per IP)
     to prevent abuse on Render free tier.
  ═══════════════════════════════════════════════════════════ */
package com.vijaykumar.portfolio.controller;

import com.vijaykumar.portfolio.dto.ApiResponse;
import com.vijaykumar.portfolio.dto.ContactRequest;
import com.vijaykumar.portfolio.exception.RateLimitExceededException;
import com.vijaykumar.portfolio.service.ContactService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/* BUG FIX: @CrossOrigin removed — CORS is handled centrally by CorsConfig.
   Having both causes the stricter annotation-level rule to override the
   global config, blocking your custom domain. */
@RestController
@RequestMapping("/api/v1")
public class ContactController {

    private static final Logger log = LoggerFactory.getLogger(ContactController.class);

    private final ContactService contactService;

    /** Simple per-IP rate limiter: IP -> last request timestamp */
    private final Map<String, Instant> rateLimitMap = new ConcurrentHashMap<>();
    private static final Duration RATE_LIMIT_WINDOW = Duration.ofSeconds(60);

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping("/contact")
    public ResponseEntity<ApiResponse> handleContact(
            @Valid @RequestBody ContactRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = extractClientIp(httpRequest);
        enforceRateLimit(clientIp);

        contactService.saveMessage(request);

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(new ApiResponse("SUCCESS", "Message received. I\'ll reply within 24 hours."));
    }

    @RequestMapping(value = "/health", method = {RequestMethod.GET, RequestMethod.HEAD})
    public ResponseEntity<ApiResponse> health() {
        return ResponseEntity.ok(new ApiResponse("UP", "Portfolio API is operational"));
    }

    /* ── Rate limiting helpers ─────────────────────────── */

    private void enforceRateLimit(String ip) {
        Instant lastRequest = rateLimitMap.get(ip);
        Instant now = Instant.now();
        if (lastRequest != null && Duration.between(lastRequest, now).compareTo(RATE_LIMIT_WINDOW) < 0) {
            long secondsRemaining = RATE_LIMIT_WINDOW.getSeconds() - Duration.between(lastRequest, now).getSeconds();
            throw new RateLimitExceededException(
                "Please wait " + secondsRemaining + " seconds before submitting again.");
        }
        rateLimitMap.put(ip, now);
    }

    private String extractClientIp(HttpServletRequest request) {
        // Render forwards via proxy — check X-Forwarded-For first
        String xfwd = request.getHeader("X-Forwarded-For");
        if (xfwd != null && !xfwd.isBlank()) {
            return xfwd.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
