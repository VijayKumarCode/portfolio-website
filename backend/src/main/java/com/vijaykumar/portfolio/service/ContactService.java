package com.vijaykumar.portfolio.service;

import com.vijaykumar.portfolio.dto.ContactFormDto;
import com.vijaykumar.portfolio.email.EmailOrchestrator;
import com.vijaykumar.portfolio.entity.ContactMessage;
import com.vijaykumar.portfolio.repository.ContactMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Contact Service — Handles contact form business logic
 * * RESPONSIBILITIES:
 * 1. Persists message to database (synchronous — must succeed before response)
 * 2. Triggers email notification (asynchronous — non-blocking)
 */
@Service
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);

    private final ContactMessageRepository contactRepository;
    private final EmailOrchestrator emailOrchestrator;

    public ContactService(ContactMessageRepository contactRepository,
                          EmailOrchestrator emailOrchestrator) {
        this.contactRepository = Objects.requireNonNull(contactRepository, "contactRepository must not be null");
        this.emailOrchestrator = Objects.requireNonNull(emailOrchestrator, "emailOrchestrator must not be null");
    }

    /**
     * Processes a contact form submission.
     * * WORKFLOW:
     * 1. Save to database (synchronous — within transaction)
     * 2. Defer email orchestration until the database transaction successfully commits
     * 3. Return result to controller
     */
    @Transactional
    public ContactMessage processContactForm(ContactFormDto dto) {
        Objects.requireNonNull(dto, "dto must not be null");

        // Create and save entity safely within the primary transaction
        ContactMessage message = new ContactMessage();
        message.setName(dto.name());
        message.setEmail(dto.email());
        message.setSubject(dto.subject());
        message.setMessage(dto.message());
        message.setCreatedAt(LocalDateTime.now());
        message.setEmailSent(false);  
        message.setEmailProvider(null);

        ContactMessage saved = contactRepository.save(message);
        log.info("Contact message persisted — id={}, from=[REDACTED]", saved.getId());
        
        // Extract the primitive ID to break direct entity reference coupling across threads
        final long messageId = Objects.requireNonNull(saved.getId(), "message id");

        // Register a transaction hook to ensure the email orchestration only triggers after a successful commit
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    triggerAsyncNotification(dto, messageId);
                }
            });
        } else {
            // Fallback safety block if executed outside an active transaction context
            triggerAsyncNotification(dto, messageId);
        }
        
        return saved;
    }

    /**
     * Dispatches the asynchronous email process pipeline outside the primary transaction scope.
     */
    private void triggerAsyncNotification(ContactFormDto dto, long messageId) {
        try {
            emailOrchestrator.sendContactNotificationAsync(dto)
                .thenAccept(report -> {
                    // Safety check on async report wrapper payload
                    if (report != null && report.delivered()) {
                        log.info("Email delivery confirmed for message id={} via {} in {}ms",
                                messageId, report.providerUsed(), report.durationMs());
                        // Update record using an isolated transactional unit
                        updateMessageDeliveryStatus(messageId, report.providerUsed());
                    } else {
                        String diagnostics = report != null ? report.diagnosticMessage() : "Empty report context";
                        log.warn("Email delivery failed for message id={} — status={}",
                                messageId, diagnostics);
                    }
                })
                .exceptionally(ex -> {
                    log.error("Email delivery callback failed for message id={}: {}",
                            messageId, ex != null ? ex.getMessage() : "Unknown exception environment");
                    return null;
                });
        } catch (Exception e) {
            log.error("Failed to trigger email execution loop for message id={}: {}", 
                    messageId, e.getMessage());
        }
    }

    /**
     * Updates delivery status inside an independent transaction window to guarantee isolation.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateMessageDeliveryStatus(long messageId, String provider) {
        contactRepository.findById(messageId).ifPresent(message -> {
            message.setEmailSent(true);
            message.setEmailProvider(provider);
            contactRepository.save(message);
            log.debug("Delivery audit metrics synced to database for message id={}", messageId);
        });
    }
}