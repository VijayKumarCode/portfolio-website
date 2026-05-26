package com.vijaykumar.portfolio.email;

import com.vijaykumar.portfolio.dto.ContactFormDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
public class EmailOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(EmailOrchestrator.class);

    private final BrevoEmailService brevoEmailService;
    private final MailerSendEmailService mailerSendEmailService;
    private final ScheduledExecutorService emailScheduler;
    private final ConcurrentHashMap<String, Long> deduplicationMap = new ConcurrentHashMap<>();

    public EmailOrchestrator(BrevoEmailService brevoEmailService, 
                             MailerSendEmailService mailerSendEmailService, 
                             ScheduledExecutorService emailScheduler) {
        this.brevoEmailService = brevoEmailService;
        this.mailerSendEmailService = mailerSendEmailService;
        this.emailScheduler = emailScheduler;
    }

    /**
     * Sends a contact notification email asynchronously with fallback support.
     * * Workflow:
     * 1. Check for duplicate submissions (same email + name within 5 minutes)
     * 2. Try primary provider (Brevo)
     * 3. If primary fails, try fallback (MailerSend)
     * 4. Log delivery success
     * * @return CompletableFuture with EmailDeliveryReport containing delivery status
     */
    public CompletableFuture<EmailDeliveryReport> sendContactNotificationAsync(ContactFormDto dto) {
        String uniqueDeduplicationKey = dto.email() + "_" + dto.name();
        long now = System.currentTimeMillis();
        Long expiryTime = deduplicationMap.get(uniqueDeduplicationKey);

        // Evaluate duplicate state passively without spinning up individual future task wrappers
        if (expiryTime != null && now < expiryTime) {
            log.warn("Duplicate submission intercepted for: {}", redactEmail(dto.email()));
            return CompletableFuture.completedFuture(new EmailDeliveryReport(false, "DEDUPLICATOR", "Spam protection active"));
        }

        // Track submission validity for the next 5 minutes
        deduplicationMap.put(uniqueDeduplicationKey, now + TimeUnit.MINUTES.toMillis(5));

        // Run the email sending logic asynchronously
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.currentTimeMillis();
            try {
                // 1. Try Primary Provider (Brevo)
                log.debug("Attempting email delivery via primary provider (Brevo)");
                EmailSendResult brevoResult = brevoEmailService.sendContactNotification(dto);
                long duration = System.currentTimeMillis() - startTime;
                
                if (brevoResult.success()) {
                    log.info("Email delivered successfully via Brevo in {}ms", duration);
                    return new EmailDeliveryReport(true, "Brevo", "Success", duration);
                }

                // 2. Fallback to Secondary Provider (MailerSend) if primary fails
                log.warn("Brevo delivery failed. Activating fallback to MailerSend");
                EmailSendResult fallbackResult = mailerSendEmailService.sendContactNotification(dto);
                long totalDuration = System.currentTimeMillis() - startTime;

                if (fallbackResult.success()) {
                    log.info("Email delivered successfully via MailerSend (fallback) in {}ms", totalDuration);
                    return new EmailDeliveryReport(true, "MailerSend", "Success via Fallback", totalDuration);
                } else {
                    log.error("Both email providers failed. Message saved but notification not sent. Status: {}",
                            fallbackResult.message());
                    return new EmailDeliveryReport(false, "MailerSend", "Both channels failed", totalDuration);
                }
                
            } catch (Exception e) {
                long totalDuration = System.currentTimeMillis() - startTime;
                log.error("Email orchestration exception: {}", e.getMessage(), e);
                return new EmailDeliveryReport(false, "ORCHESTRATOR", e.getMessage(), totalDuration);
            }
        }, emailScheduler);
    }

    /**
     * Background scavenger task running periodically every 15 minutes.
     * This cleans up expired map keys to protect heap memory.
     */
    @jakarta.annotation.PostConstruct
    public void initExpiredCleanUpTask() {
        emailScheduler.scheduleAtFixedRate(() -> {
            try {
                long now = System.currentTimeMillis();
                deduplicationMap.entrySet().removeIf(entry -> now >= entry.getValue());
            } catch (Exception e) {
                log.error("Error occurred running background deduplication cleanup task", e);
            }
        }, 15, 15, TimeUnit.MINUTES);
    }

    /**
     * Redacts email for safe logging (shows only domain).
     */
    private String redactEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "[REDACTED]";
        }
        String[] parts = email.split("@");
        return "[...]@" + parts[1];
    }
}