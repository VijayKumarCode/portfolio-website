/* ═══════════════════════════════════════════════════════════
   Portfolio Backend v2.0 — ContactService.java
   Added: email notification to you when contact form submitted.
   Uses the same OtpService/Resend HTTP API pattern from Nexus.
   Message is STILL saved to PostgreSQL (contact_messages table).
═══════════════════════════════════════════════════════════ */
package com.vijaykumar.portfolio.service;

import com.vijaykumar.portfolio.model.ContactRequest;
import com.vijaykumar.portfolio.entity.ContactMessage;
import com.vijaykumar.portfolio.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContactService {

    private final ContactRepository repository;
    private final RestTemplate restTemplate;

    @Value("${RESEND_API_KEY}")
    private String resendApiKey;

    /* Your email — change this to your real address */
    @Value("${app.notify-email}")
    private String notifyEmail;

    /* The from address — must match your Resend verified domain */
    @Value("${app.mail-from}")
    private String mailFrom;

    public void saveMessage(ContactRequest request) {

        /* 1. Save to database — always first, never skip */
        ContactMessage entity = new ContactMessage(
                request.name(),
                request.email(),
                request.message()
        );
        repository.save(entity);
        log.info("Contact message saved — from={}", request.email());

        /* 2. Send notification email to you */
        try {
            sendNotification(request);
        } catch (Exception e) {
            /* Do NOT rethrow — if email fails, message is still saved.
               The frontend still gets 201 and the data is in Neon. */
            log.error("Notification email failed (message was saved): {}", e.getMessage());
        }
    }

   private void sendNotification(ContactRequest req) {
        String subject = "Portfolio contact from " + req.name();
        
        // Plain text version
        String text = String.format(
                "New message via vijaykumarcode.space\n\nFrom: %s\nEmail: %s\n\nMessage:\n%s",
                req.name(), req.email(), req.message()
        );
        
        // HTML version
        String html = String.format(
                "<h3>New contact form submission</h3>" +
                "<p><strong>Name:</strong> %s</p>" +
                "<p><strong>Email:</strong> <a href='mailto:%s'>%s</a></p>" +
                "<p><strong>Message:</strong></p><p>%s</p>" +
                "<hr><p><small>Sent from vijaykumarcode.space</small></p>",
                escHtml(req.name()),
                escHtml(req.email()), escHtml(req.email()),
                escHtml(req.message()).replace("\n", "<br>")
        );

        // Safely build the JSON body using a Map
        Map<String, Object> body = new HashMap<>();
        body.put("from", mailFrom);
        body.put("to", List.of(notifyEmail)); // Resend API expects an array for 'to'
        body.put("subject", subject);
        body.put("text", text);
        body.put("html", html);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        ResponseEntity<String> resp = restTemplate.postForEntity(
                "https://api.resend.com/emails",
                new HttpEntity<>(body, headers),
                String.class
        );
        log.info("Notification sent — status={}", resp.getStatusCode());
    }

    private String escHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}