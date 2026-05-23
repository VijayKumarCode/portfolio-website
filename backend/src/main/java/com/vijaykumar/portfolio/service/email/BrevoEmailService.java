package com.vijaykumar.portfolio.service.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Brevo REST API email provider — PRIMARY.
 *
 * Uses Brevo transactional email endpoint:
 * POST https://api.brevo.com/v3/smtp/email
 *
 * Authentication: api-key header (NOT Bearer).
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 *
 * PRODUCTION FIXES:
 * - Added detailed error logging to diagnose authentication failures
 * - Logs API key presence check (never logs actual key)
 * - Logs full response body on failure for debugging
 */
@Service
public class BrevoEmailService implements EmailProvider {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailService.class);

    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String senderEmail;

    public BrevoEmailService(
            RestTemplate restTemplate,
            @Value("${email.brevo.api-key:}") String apiKey,
            @Value("${email.sender:noreply@vijaykumarcode.space}") String senderEmail) {
        this.restTemplate = restTemplate;
        this.apiKey = apiKey;
        this.senderEmail = senderEmail;
        
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Brevo API key is NOT configured — provider will be skipped");
        } else {
            log.info("Brevo provider initialized — apiKey length: {}, sender: {}", 
                apiKey.length(), senderEmail);
        }
    }

    @Override
    public String name() {
        return "Brevo";
    }

    @Override
    public boolean send(String to, String subject, String text, String html) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Brevo API key is not configured — skipping");
            return false;
        }

        Map<String, Object> body = Map.of(
            "sender", Map.of("email", senderEmail, "name", "Vijay Kumar Portfolio"),
            "to", List.of(Map.of("email", to)),
            "subject", subject,
            "textContent", text,
            "htmlContent", html != null ? html : text
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            log.debug("Brevo: Sending email to={}, subject={}, sender={}", to, subject, senderEmail);
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_URL, request, String.class);
            boolean success = response.getStatusCode().is2xxSuccessful();
            if (success) {
                log.info("Brevo email accepted — to={}, status={}", to, response.getStatusCode());
            } else {
                log.warn("Brevo returned non-2xx — status={}, body={}", response.getStatusCode(), response.getBody());
            }
            return success;
        } catch (RestClientResponseException ex) {
            // Production fix: Log full response for 401 diagnosis
            log.error("Brevo API error — status={} {}, body={}", 
                ex.getStatusCode(), ex.getStatusText(), ex.getResponseBodyAsString());
            
            // Log context for debugging authentication failures
            if (ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                log.error("Brevo 401 UNAUTHORIZED — possible causes:");
                log.error("  1. API key invalid or expired");
                log.error("  2. Sender email '{}' not verified in Brevo dashboard", senderEmail);
                log.error("  3. API key has hidden characters (newline/space)");
                log.error("  4. Wrong API key environment variable");
            }
            
            throw ex;
        }
    }
}
