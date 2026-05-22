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
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_URL, request, String.class);
            boolean success = response.getStatusCode().is2xxSuccessful();
            if (success) {
                log.info("Brevo email accepted — to={}, status={}", to, response.getStatusCode());
            } else {
                log.warn("Brevo returned non-2xx — status={}, body={}", response.getStatusCode(), response.getBody());
            }
            return success;
        } catch (RestClientResponseException ex) {
            log.error("Brevo API error — status={}, body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw ex;
        }
    }
}