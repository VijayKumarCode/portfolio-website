package com.vijaykumar.portfolio.service;

import com.vijaykumar.portfolio.entity.ContactMessage;
import com.vijaykumar.portfolio.model.ContactRequest;
import com.vijaykumar.portfolio.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactService {

    private final ContactRepository repository;
    private final RestTemplate restTemplate;

    /*
     * BUG FIX: Added default values to all @Value fields.
     *
     * Without defaults, if the property is missing in the active
     * profile (e.g. running locally without prod profile, or a
     * missing Render env var), Spring throws:
     *   PlaceholderResolutionException: Could not resolve placeholder
     *
     * With defaults:
     * - Local dev: uses the dummy/fallback values; email send will
     *   fail gracefully (logged, not rethrown), message still saved.
     * - Production: Render env vars override the defaults correctly.
     *
     * app.mail-from is hardcoded to onboarding@resend.dev because
     * the Resend free tier only allows ONE verified domain, which is
     * already used by nexusgame.space. No code change is needed if
     * the domain changes later — just update the property file.
     */
    @Value("${RESEND_API_KEY:re_dummy_local_key}")
    private String resendApiKey;

    @Value("${app.notify-email:vkumar.kumar31@gmail.com}")
    private String notifyEmail;

    @Value("${app.mail-from:onboarding@resend.dev}")
    private String mailFrom;

    /* ── Public API ──────────────────────────────────── */

    public void saveMessage(ContactRequest request) {
        // Step 1: Always save to DB first — never skip or reorder
        ContactMessage entity = new ContactMessage(
                request.name(),
                request.email(),
                request.message()
        );
        repository.save(entity);
        log.info("Contact message saved — from={}", request.email());

        // Step 2: Send email notification — failure never blocks the response
        try {
            sendNotification(request);
        } catch (Exception e) {
            log.error("Email notification failed (message is saved in DB): {}", e.getMessage());
        }
    }

    /* ── Private helpers ─────────────────────────────── */

    private void sendNotification(ContactRequest req) {
        String subject = "Portfolio contact from " + req.name();

        String text = String.format(
                "New message via vijaykumarcode.space\n\n" +
                "From:    %s\nEmail:   %s\n\nMessage:\n%s",
                req.name(), req.email(), req.message()
        );

        String html = String.format(
                "<h3>New contact via vijaykumarcode.space</h3>" +
                "<p><strong>Name:</strong> %s</p>" +
                "<p><strong>Reply to:</strong> <a href='mailto:%s'>%s</a></p>" +
                "<p><strong>Message:</strong></p>" +
                "<blockquote>%s</blockquote>",
                escHtml(req.name()),
                escHtml(req.email()), escHtml(req.email()),
                escHtml(req.message()).replace("\n", "<br>")
        );

        // Map<String,Object> — Jackson serialises this safely.
        // Never build JSON strings manually (escaping bugs).
        Map<String, Object> body = new HashMap<>();
        body.put("from",    mailFrom);
        body.put("to",      List.of(notifyEmail));
        body.put("subject", subject);
        body.put("text",    text);
        body.put("html",    html);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        ResponseEntity<String> resp = restTemplate.postForEntity(
                "https://api.resend.com/emails",
                new HttpEntity<>(body, headers),
                String.class
        );
        log.info("Email notification sent — status={}", resp.getStatusCode());
    }

    private String escHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}