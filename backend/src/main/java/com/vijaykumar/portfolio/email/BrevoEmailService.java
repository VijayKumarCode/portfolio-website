package com.vijaykumar.portfolio.email;

import com.vijaykumar.portfolio.dto.ContactFormDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class BrevoEmailService {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailService.class);
    private final RestTemplate restTemplate;

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${app.notify-email}")
    private String notifyEmail;

    @Value("${app.mail-from-email}")
    private String fromEmail;

    @Value("${app.mail-from-name}")
    private String fromName;

    public BrevoEmailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public EmailSendResult sendContactNotification(ContactFormDto dto) {
        String endpoint = "https://api.brevo.com/v3/smtp/email";
        
        // Clean API key: remove quotes, all whitespace (including newlines), and trim
        String cleanApiKey = sanitizeApiKey(apiKey);
        
        if (cleanApiKey.isEmpty()) {
            log.error("Brevo API key is empty or missing - cannot send email");
            return new EmailSendResult(false, "API key not configured");
        }
        
        String sanitizedMessage = dto.message();  // Plain text - no HTML escaping needed

        Map<String, Object> payload = new HashMap<>();
        payload.put("sender", Map.of("name", fromName, "email", fromEmail));
        payload.put("to", List.of(Map.of("email", notifyEmail, "name", "Portfolio Admin")));
        payload.put("replyTo", Map.of("email", dto.email(), "name", dto.name()));
        payload.put("subject", "Portfolio Contact: " + dto.name());
        payload.put("textContent", String.format("Inquiry from %s (%s):\n\n%s", dto.name(), dto.email(), sanitizedMessage));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", cleanApiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            log.info("Sending email via Brevo API");
            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Brevo email sent successfully");
                return new EmailSendResult(true, "Success");
            }
            
            String errorBody = response.getBody();
            log.warn("Brevo returned non-2xx status: {} — response: {}", response.getStatusCode(), errorBody);
            return new EmailSendResult(false, errorBody != null ? errorBody : "Non-2xx status");
            
        } catch (HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("Brevo HTTP error ({}): {}", e.getStatusCode(), errorBody);
            return new EmailSendResult(false, errorBody);
            
        } catch (Exception e) {
            log.error("Brevo email send failed: {}", e.getMessage());
            return new EmailSendResult(false, e.getMessage());
        }
    }

    /**
     * Sanitizes API key by removing quotes, all whitespace (including newlines),
     * and trimming. This prevents issues with environment variable corruption
     * in Render where newlines may be embedded.
     */
    private String sanitizeApiKey(String apiKey) {
        if (apiKey == null || apiKey.isEmpty()) {
            return "";
        }
        
        return apiKey
            .replace("\"", "")          // Remove quotes
            .replaceAll("\\s+", "")     // Remove ALL whitespace (space, tab, newline, etc.)
            .trim();
    }
}