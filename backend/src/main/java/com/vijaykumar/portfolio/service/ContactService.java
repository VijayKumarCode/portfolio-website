package com.vijaykumar.portfolio.service;

import com.vijaykumar.portfolio.dto.ContactFormDto;
import com.vijaykumar.portfolio.email.EmailOrchestrator;
import com.vijaykumar.portfolio.entity.ContactMessage;
import com.vijaykumar.portfolio.repository.ContactMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Contact Service — Handles contact form business logic
 * 
 * RESPONSIBILITIES:
 * 1. Persists message to database (synchronous — must succeed before response)
 * 2. Triggers email notification (asynchronous — non-blocking)
 * 
 * ARCHITECTURE:
 * - Input validation is handled by @Valid on ContactFormDto (no redundant validation here)
 * - DB save is synchronous: client gets confirmation that message is stored
 * - Email send is asynchronous: triggered after successful save, doesn't block response
 * - This gives the best UX: fast response + reliable delivery
 */
@Service
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);

    private final ContactMessageRepository contactRepository;
    private final EmailOrchestrator emailOrchestrator;

    public ContactService(ContactMessageRepository contactRepository,
                          EmailOrchestrator emailOrchestrator) {
        this.contactRepository = contactRepository;
        this.emailOrchestrator = emailOrchestrator;
    }

    /**
     * Processes a contact form submission.
     * 
     * WORKFLOW:
     * 1. Save to database (synchronous — within transaction)
     * 2. Trigger email notification (asynchronous — fire and forget)
     * 3. Return result to controller
     * 
     * @param dto The contact form data from the frontend (already validated by @Valid)
     * @return The saved contact message entity
     */
    @Transactional
    public ContactMessage processContactForm(ContactFormDto dto) {
        // Create and save entity
        ContactMessage message = new ContactMessage();
        message.setName(dto.name());
        message.setEmail(dto.email());
        message.setSubject(dto.subject());
        message.setMessage(dto.message());
        message.setCreatedAt(LocalDateTime.now());
        message.setEmailSent(false);  // Will be updated async if needed
        message.setEmailProvider(null);

        ContactMessage saved = contactRepository.save(message);
        
        log.info("Contact message persisted — id={}, from=[REDACTED]", saved.getId());
        
        // Trigger email notification (ASYNC — non-blocking)
        // The email send runs in a separate thread pool.
        // If it fails, the DB record still exists and can be retried later.
        try {
            emailOrchestrator.sendContactNotificationAsync(dto)
                .thenAccept(report -> {
                    if (report.delivered()) {
                        log.info("Email delivery confirmed for message id={} via {} in {}ms",
                                saved.getId(), report.providerUsed(), report.durationMs());
                        // Update DB record with delivery status
                        saved.setEmailSent(true);
                        saved.setEmailProvider(report.providerUsed());
                        contactRepository.save(saved);
                    } else {
                        log.warn("Email delivery failed for message id={} — status={}",
                                saved.getId(), report.diagnosticMessage());
                        // EmailSent remains false — can be retried later
                    }
                })
                .exceptionally(ex -> {
                    log.error("Email delivery callback failed for message id={}: {}",
                            saved.getId(), ex.getMessage());
                    return null;
                });
        } catch (Exception e) {
            // Don't let email failure break the contact form submission
            log.error("Failed to trigger email for message id={}: {}", 
                    saved.getId(), e.getMessage());
        }
        
        return saved;
    }
}
