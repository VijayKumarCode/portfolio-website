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
import java.util.Objects;

/**
 * MailerSend REST API email provider — FALLBACK.
 *
 * Used automatically when Brevo fails after retries.
 *
 * Endpoint: POST https://api.mailersend.com/v1/email
 * Authentication: Authorization: Bearer <token>
 * Docs: https://developers.mailersend.com/api/v1/email.html
 *
 * PRODUCTION FIXES:
 * - Added detailed error logging for observability
 * - Logs provider initialization status
 * - Logs response body on failures
 */
@Service
public class MailerSendEmailService implements EmailProvider {

    private static final Logger log = LoggerFactory.getLogger(MailerSendEmailService.class);

    private static final String MAILERSEND_URL = "https://api.mailersend.com/v1/email";

    private final RestTemplate restTemplate;
    private final String apiToken;
    private final String senderEmail;

    public MailerSendEmailService(
            RestTemplate restTemplate,
            @Value("${email.mailersend.api-token:}") String apiToken,
            @Value("${email.sender:noreply@vijaykumarcode.space}") String senderEmail) {
        this.restTemplate = restTemplate;
        this.apiToken = apiToken;
        this.senderEmail = senderEmail;
        
        if (apiToken == null || apiToken.isBlank()) {
            log.warn("MailerSend API token is NOT configured — provider will be skipped");
        } else {
            log.info("MailerSend provider initialized — token length: {}, sender: {}", 
                apiToken.length(), senderEmail);
        }
    }

    @Override
    public String name() {
        return "MailerSend";
    }

    @Override
    public boolean send(String to, String subject, String text, String html) throws Exception {
        if (apiToken == null || apiToken.isBlank()) {
            log.warn("MailerSend API token is not configured — skipping");
            return false;
        }

        Map<String, Object> body = Map.of(
            "from", Map.of("email", senderEmail, "name", "Vijay Kumar Portfolio"),
            "to", List.of(Map.of("email", to)),
            "subject", subject,
            "text", text,
            "html", html != null ? html : text
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(Objects.requireNonNull(apiToken));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            log.debug("MailerSend: Sending email to={}, subject={}, sender={}", to, subject, senderEmail);
            ResponseEntity<String> response = restTemplate.postForEntity(MAILERSEND_URL, request, String.class);
            boolean success = response.getStatusCode().is2xxSuccessful();
            if (success) {
                log.info("MailerSend email accepted — to={}, status={}", to, response.getStatusCode());
            } else {
                log.warn("MailerSend returned non-2xx — status={}, body={}", response.getStatusCode(), response.getBody());
            }
            return success;
        } catch (RestClientResponseException ex) {
            log.error("MailerSend API error — status={} {}, body={}", 
                ex.getStatusCode(), ex.getStatusText(), ex.getResponseBodyAsString());
            throw ex;
        }
    }
}
