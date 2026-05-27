package com.vijaykumar.portfolio.email;

import com.vijaykumar.portfolio.dto.ContactFormDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MailerSendEmailService implements EmailProvider {

    private static final Logger log = LoggerFactory.getLogger(MailerSendEmailService.class);
    private final RestTemplate restTemplate;

    @Value("${mailersend.api.key}")
    private String apiKey;

    @Value("${mailersend.api.url}")
    private String apiUrl;

    @Value("${app.notify-email}")
    private String notifyEmail;

    @Value("${app.mail-from-email}")
    private String fromEmail;

    @Value("${app.mail-from-name}")
    private String fromName;

    public MailerSendEmailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public String getProviderName() {
        return "MailerSend";
    }

    @Override
    public EmailSendResult sendContactNotification(ContactFormDto dto) {
        String cleanApiKey = sanitizeApiKey(apiKey);
        
        if (cleanApiKey.isEmpty()) {
            log.error("MailerSend API key is empty or missing - cannot send email");
            return new EmailSendResult(false, false, "API key not configured");
        }
        
        String sanitizedMessage = dto.message();

        Map<String, Object> payload = new HashMap<>();
        payload.put("from", Map.of("email", fromEmail, "name", fromName));
        payload.put("to", List.of(Map.of("email", notifyEmail, "name", "Portfolio Admin")));
        payload.put("reply_to", Map.of("email", dto.email(), "name", dto.name()));
        payload.put("subject", "Portfolio Contact (Fallback): " + dto.name());
        payload.put("text", String.format("Inquiry from %s (%s):\n\n%s", dto.name(), dto.email(), sanitizedMessage));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(cleanApiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            log.info("Sending email via MailerSend API: {}", apiUrl);
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("MailerSend email sent successfully");
                return new EmailSendResult(true, false, "Success via Fallback");
            }
            
            String errorBody = response.getBody();
            log.warn("MailerSend returned non-2xx status: {} — response: {}", response.getStatusCode(), errorBody);
            return new EmailSendResult(false, false, errorBody != null ? errorBody : "Non-2xx status");
            
        }  catch (Exception e) {
            log.error("MailerSend email send execution failed: {}", e.getMessage());
            return new EmailSendResult(false, false, e.getMessage());
        } 
    }

    private String sanitizeApiKey(String apiKey) {
        if (apiKey == null || apiKey.isEmpty()) {
            return "";
        }
        return apiKey.replace("\"", "").replaceAll("\\s+", "").trim();
    }
}