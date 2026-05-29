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
 * Brevo Email Service — Primary email provider via REST API.
 *
 * ─── BUGS FIXED ─────────────────────────────────────────────────────────────
 *
 * BUG 1 (HIGH — startup crash if env vars absent):
 *   Original @Value annotations had NO default values:
 *     @Value("${brevo.api.key}")          ← throws on missing property
 *     @Value("${brevo.api.url}")          ← throws on missing property
 *     @Value("${app.mail-from-email}")    ← throws on missing property
 *     @Value("${app.mail-from-name}")     ← throws on missing property
 *   If any Render environment variable is missing or misspelled, Spring Boot
 *   fails to start with: IllegalArgumentException: Could not resolve placeholder
 *   FIX: Added empty/sensible defaults to all @Value annotations.
 *   The sanitizeApiKey() check already handles the empty-key case gracefully.
 *
 * BUG 2 (LOW — incomplete email payload):
 *   Original payload used only textContent (plain text).
 *   FIX: Added htmlContent for better email rendering in Gmail/Outlook.
 *   Falls back gracefully for clients that show text only.
 *
 * NO OTHER CHANGES. Logic, flow, and provider name preserved exactly.
 */
@Service
public class BrevoEmailService implements EmailProvider {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailService.class);

    // ── Brevo REST API ──────────────────────────────────────────────────────
    // https://developers.brevo.com/reference/sendtransacemail
    private static final String BREVO_DEFAULT_URL = "https://api.brevo.com/v3/smtp/email";

    private final RestTemplate restTemplate;

    // Safe defaults prevent startup failure when env vars are not yet configured.
    // Empty apiKey is caught by sanitizeApiKey() which returns gracefully.
    @Value("${brevo.api.key:}")
    private String apiKey;

    @Value("${brevo.api.url:" + BREVO_DEFAULT_URL + "}")
    private String apiUrl;

    @Value("${app.notify-email:}")
    private String notifyEmail;

    @Value("${app.mail-from-email:noreply@vijaykumarcode.space}")
    private String fromEmail;

    @Value("${app.mail-from-name:Vijay Kumar Portfolio}")
    private String fromName;

    public BrevoEmailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public String getProviderName() {
        return "Brevo";
    }

    @Override
    public EmailSendResult sendContactNotification(ContactFormDto dto) {
        String cleanApiKey = sanitizeApiKey(apiKey);

        if (cleanApiKey.isEmpty()) {
            log.error("Brevo API key is empty or missing — set BREVO_API_KEY env var on Render");
            return new EmailSendResult(false, "Brevo API key not configured");
        }

        if (notifyEmail == null || notifyEmail.isBlank()) {
            log.error("Notification email not configured — set APP_NOTIFY_EMAIL env var on Render");
            return new EmailSendResult(false, "Notification email not configured");
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("sender",    Map.of("name", fromName, "email", fromEmail));
        payload.put("to",        List.of(Map.of("email", notifyEmail, "name", "Vijay Kumar")));
        payload.put("replyTo",   Map.of("email", dto.email(), "name", dto.name()));
        payload.put("subject",   "Portfolio Contact: " + dto.name());
        payload.put("textContent", buildText(dto));
        payload.put("htmlContent", buildHtml(dto));   // BUG 2 FIX: added HTML body

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", cleanApiKey);   // Brevo-specific header name

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            log.info("Sending email via Brevo to: {}", redactEmail(notifyEmail));
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Brevo email sent successfully (HTTP {})", response.getStatusCode().value());
                return new EmailSendResult(true, "Success");
            }

            String errorBody = response.getBody();
            log.warn("Brevo returned non-2xx: {} — body: {}", response.getStatusCode(), errorBody);
            return new EmailSendResult(false, errorBody != null ? errorBody : "Non-2xx status");

        } catch (Exception e) {
            log.error("Brevo send failed: {}", e.getMessage());
            return new EmailSendResult(false, e.getMessage());
        }
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    private String buildText(ContactFormDto dto) {
        return String.format(
            "New contact from your portfolio\n\nName:    %s\nEmail:   %s\nSubject: %s\nMessage:\n\n%s",
            dto.name(), dto.email(), dto.subject(), dto.message()
        );
    }

    private String buildHtml(ContactFormDto dto) {
        return """
            <!DOCTYPE html><html><body
              style="font-family:Arial,sans-serif;background:#0a0d13;color:#e6edf3;
                     max-width:600px;margin:0 auto;padding:32px 20px;">
              <div style="border:1px solid rgba(47,129,247,0.2);border-radius:8px;padding:28px;">
                <h2 style="color:#2f81f7;margin:0 0 20px;font-size:18px;">Portfolio Contact</h2>
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
          log.debug("Brevo key loaded (prefix): {}...", cleaned.substring(0, Math.min(6, cleaned.length())));
        }
     return cleaned;
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private static String redactEmail(String email) {
        if (email == null || !email.contains("@")) return "[REDACTED]";
        return "[...]@" + email.split("@")[1];
    }
}