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

/**
 * MailerSend Email Service — Secondary fallback email provider via REST API.
 *
 * ─── BUGS FIXED ─────────────────────────────────────────────────────────────
 *
 * BUG 1 (HIGH — startup crash if env vars absent):
 *   Original @Value annotations had NO default values.
 *   If MAILERSEND_API_KEY or any other env var is not set on Render,
 *   Spring Boot throws: IllegalArgumentException: Could not resolve placeholder
 *   FIX: Added empty/sensible defaults to all @Value annotations.
 *
 * BUG 2 (LOW — incomplete email payload):
 *   Original used 'text' field only.
 *   FIX: Added 'html' field for better rendering.
 *
 * NO OTHER CHANGES. Logic and flow preserved exactly.
 */
@Service
public class MailerSendEmailService implements EmailProvider {

    private static final Logger log = LoggerFactory.getLogger(MailerSendEmailService.class);

    // MailerSend transactional email API
    // https://developers.mailersend.com/api/v1/email.html
    private static final String MAILERSEND_DEFAULT_URL = "https://api.mailersend.com/v1/email";

    private final RestTemplate restTemplate;

    // Safe empty defaults — missing key is caught by sanitizeApiKey() check
    @Value("${mailersend.api.key:}")
    private String apiKey;

    @Value("${mailersend.api.url:" + MAILERSEND_DEFAULT_URL + "}")
    private String apiUrl;

    @Value("${app.notify-email:}")
    private String notifyEmail;

    @Value("${app.mail-from-email:noreply@vijaykumarcode.space}")
    private String fromEmail;

    @Value("${app.mail-from-name:Vijay Kumar Portfolio}")
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
            log.error("MailerSend API key is empty — set MAILERSEND_API_KEY env var on Render");
            return new EmailSendResult(false, false, "MailerSend API key not configured");
        }

        if (notifyEmail == null || notifyEmail.isBlank()) {
            log.error("Notification email not configured — set APP_NOTIFY_EMAIL env var on Render");
            return new EmailSendResult(false, false, "Notification email not configured");
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("from",     Map.of("email", fromEmail, "name", fromName));
        payload.put("to",       List.of(Map.of("email", notifyEmail, "name", "Vijay Kumar")));
        payload.put("reply_to", Map.of("email", dto.email(), "name", dto.name()));
        payload.put("subject",  "Portfolio Contact (Fallback): " + dto.name());
        payload.put("text",     buildText(dto));
        payload.put("html",     buildHtml(dto));   // BUG 2 FIX: added HTML body

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(cleanApiKey);         // "Authorization: Bearer mlsn.xxx"

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            log.info("Sending email via MailerSend (fallback)");
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);

            // MailerSend returns 202 Accepted on success
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("MailerSend email sent successfully (HTTP {})", response.getStatusCode().value());
                return new EmailSendResult(true, false, "Success via Fallback");
            }

            String errorBody = response.getBody();
            log.warn("MailerSend returned non-2xx: {} — body: {}", response.getStatusCode(), errorBody);
            return new EmailSendResult(false, false, errorBody != null ? errorBody : "Non-2xx status");

        } catch (Exception e) {
            log.error("MailerSend send failed: {}", e.getMessage());
            return new EmailSendResult(false, false, e.getMessage());
        }
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    private String buildText(ContactFormDto dto) {
        return String.format(
            "New contact from your portfolio (via fallback)\n\nName:    %s\nEmail:   %s\nSubject: %s\nMessage:\n\n%s",
            dto.name(), dto.email(), dto.subject(), dto.message()
        );
    }

    private String buildHtml(ContactFormDto dto) {
        return """
            <!DOCTYPE html><html><body
              style="font-family:Arial,sans-serif;background:#0a0d13;color:#e6edf3;
                     max-width:600px;margin:0 auto;padding:32px 20px;">
              <div style="border:1px solid rgba(47,129,247,0.2);border-radius:8px;padding:28px;">
                <h2 style="color:#2f81f7;margin:0 0 20px;font-size:18px;">
                  Portfolio Contact <span style="font-size:13px;color:#7d8590;">(via MailerSend fallback)</span>
                </h2>
                <p><strong style="color:#7d8590;">From:</strong> %s &lt;%s&gt;</p>
                <p><strong style="color:#7d8590;">Subject:</strong> %s</p>
                <hr style="border:none;border-top:1px solid rgba(47,129,247,0.15);margin:16px 0;"/>
                <p style="white-space:pre-wrap;line-height:1.7;">%s</p>
              </div>
            </body></html>
            """.formatted(esc(dto.name()), esc(dto.email()), esc(dto.subject()), esc(dto.message()));
    }

    private String sanitizeApiKey(String key) {
        if (key == null || key.isEmpty()) return "";
        String cleaned = key.replace("\"", "").replaceAll("\\s+", "").trim();
        if (!cleaned.isEmpty()) {
            log.debug("MailerSend key loaded (prefix): {}...", 
            cleaned.substring(0, Math.min(6, cleaned.length())));
        }
        return cleaned;
    }

    private static String esc(String s) {
        if (s == null) return "";
            return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        }
    }