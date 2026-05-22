package com.vijaykumar.portfolio.service;

import com.vijaykumar.portfolio.dto.ContactRequest;
import com.vijaykumar.portfolio.entity.ContactMessage;
import com.vijaykumar.portfolio.repository.ContactRepository;
import com.vijaykumar.portfolio.service.email.EmailOrchestrator;
import com.vijaykumar.portfolio.util.HtmlEscaper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ContactService — handles contact form persistence and email notification.
 *
 * Architecture:
 *   1. Save message to PostgreSQL (transactional, never skipped).
 *   2. Send email notification via EmailOrchestrator (Brevo → MailerSend fallback).
 *   3. Email failure is logged but NEVER blocks the HTTP response —
 *      the user sees success even if providers are down.
 *
 * No SMTP. No JavaMailSender. No port 587.
 */
@Service
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);

    private final ContactRepository repository;
    private final EmailOrchestrator emailOrchestrator;

    public ContactService(ContactRepository repository, EmailOrchestrator emailOrchestrator) {
        this.repository = repository;
        this.emailOrchestrator = emailOrchestrator;
    }

    @Value("${email.notify:vkumar.kumar31@gmail.com}")
    private String notifyEmail;

    @Value("${email.sender:no-reply@vijaykumarcode.space}")
    private String senderEmail;

    /**
     * Save contact message and trigger async email notification.
     */
    @Transactional
    public void saveMessage(ContactRequest request) {
        // Step 1: Persist — never skip, never reorder
        ContactMessage entity = new ContactMessage(
            request.name(),
            request.email(),
            request.message()
        );
        repository.save(entity);
        log.info("Contact message saved — from={}, id={}", request.email(), entity.getId());

        // Step 2: Notify — failure is isolated, never blocks response
        try {
            sendNotification(request);
        } catch (Exception e) {
            log.error("Email notification failed (message is safely saved in DB): {}", e.getMessage());
        }
    }

    /* ── Private: email composition ─────────────────────── */

    private void sendNotification(ContactRequest req) {
        String subject = "Portfolio contact from " + req.name();

        String text = String.format(
            "New message via vijaykumarcode.space\n\n" +
            "From: %s\nEmail: %s\n\nMessage:\n%s",
            req.name(), req.email(), req.message()
        );

        String html = String.format(
            "<h3>New contact via vijaykumarcode.space</h3>" +
            "<p><strong>Name:</strong> %s</p>" +
            "<p><strong>Reply to:</strong> <a href=\"mailto:%s\">%s</a></p>" +
            "<p><strong>Message:</strong></p>" +
            "<blockquote>%s</blockquote>",
            HtmlEscaper.escape(req.name()),
            HtmlEscaper.escape(req.email()),
            HtmlEscaper.escape(req.email()),
            HtmlEscaper.escape(req.message()).replace("\n", "<br>")
        );

        emailOrchestrator.send(notifyEmail, subject, text, html);
    }
}
