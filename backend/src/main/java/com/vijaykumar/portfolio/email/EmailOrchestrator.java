package com.vijaykumar.portfolio.email;

import com.vijaykumar.portfolio.dto.ContactFormDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
public class EmailOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(EmailOrchestrator.class);

    private final EmailProvider brevoEmailService;
    private final EmailProvider mailerSendEmailService;
    private final Executor emailExecutor;
    private final ScheduledExecutorService emailScheduler;
    private final ConcurrentHashMap<String, Long> deduplicationMap = new ConcurrentHashMap<>();

    public EmailOrchestrator(
            BrevoEmailService brevoEmailService, 
            MailerSendEmailService mailerSendEmailService, 
            @Qualifier("emailExecutor") Executor emailExecutor,
            @Qualifier("emailScheduler") ScheduledExecutorService emailScheduler) {
        this.brevoEmailService = brevoEmailService;
        this.mailerSendEmailService = mailerSendEmailService;
        this.emailExecutor = emailExecutor;
        this.emailScheduler = emailScheduler;
    }

    public CompletableFuture<EmailDeliveryReport> sendContactNotificationAsync(ContactFormDto dto) {
        String uniqueDeduplicationKey = dto.email() + "_" + dto.name();
        long now = System.currentTimeMillis();
        Long expiryTime = deduplicationMap.get(uniqueDeduplicationKey);

        if (expiryTime != null && now < expiryTime) {
            log.warn("Duplicate submission intercepted for: {}", redactEmail(dto.email()));
            return CompletableFuture.completedFuture(new EmailDeliveryReport(false, "DEDUPLICATOR", "Spam protection active"));
        }

        deduplicationMap.put(uniqueDeduplicationKey, now + TimeUnit.MINUTES.toMillis(5));

        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.currentTimeMillis();
            try {
                log.debug("Attempting email delivery via primary provider (Brevo)");
                EmailSendResult brevoResult = brevoEmailService.sendContactNotification(dto);
                long duration = System.currentTimeMillis() - startTime;
                
                if (brevoResult.success()) {
                    log.info("Email delivered successfully via Brevo in {}ms", duration);
                    return new EmailDeliveryReport(true, brevoEmailService.getProviderName(), "Success", duration);
                }

                log.warn("Brevo delivery failed. Activating fallback to MailerSend. Failure reason: {}", brevoResult.message());
                EmailSendResult fallbackResult = mailerSendEmailService.sendContactNotification(dto);
                long totalDuration = System.currentTimeMillis() - startTime;

                if (fallbackResult.success()) {
                    log.info("Email delivered successfully via MailerSend (fallback) in {}ms", totalDuration);
                    return new EmailDeliveryReport(true, mailerSendEmailService.getProviderName(), "Success via Fallback", totalDuration);
                } else {
                    log.error("Both email providers failed. Message saved but notification not sent. Status: {}",
                            fallbackResult.message());
                    return new EmailDeliveryReport(false, mailerSendEmailService.getProviderName(), "Both channels failed", totalDuration);
                }
                
            } catch (Exception e) {
                long totalDuration = System.currentTimeMillis() - startTime;
                log.error("Email orchestration exception: {}", e.getMessage(), e);
                return new EmailDeliveryReport(false, "ORCHESTRATOR", e.getMessage(), totalDuration);
            }
        }, emailExecutor);
    }

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

    private String redactEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "[REDACTED]";
        }
        String[] parts = email.split("@");
        return "[...]@" + parts[1];
    }
}