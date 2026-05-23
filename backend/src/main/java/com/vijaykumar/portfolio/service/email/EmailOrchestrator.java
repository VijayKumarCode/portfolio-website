package com.vijaykumar.portfolio.service.email;

import com.vijaykumar.portfolio.exception.EmailDeliveryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * EmailOrchestrator — centralised email delivery with automatic fallback.
 *
 * Strategy:
 *   1. Try PRIMARY (Brevo) with up to 2 retries (3 attempts total).
 *   2. If Brevo fails, try FALLBACK (MailerSend) with 1 retry (2 attempts total).
 *   3. If both fail, throw EmailDeliveryException.
 *
 * Deduplication:
 *   - Tracks recently sent emails by content hash (5-minute window).
 *   - Prevents duplicate sends if the user double-clicks Submit
 *     or if a network retry causes the controller to call twice.
 *
 * Thread safety:
 *   - Uses ConcurrentHashMap for dedup cache.
 *   - All state is local — safe for Render free-tier single instance.
 *
 * PRODUCTION FIXES:
 * - Changed provider attempt logging from DEBUG to INFO level
 * - All provider attempts now logged at INFO for visibility
 * - Better dedup logging to prevent duplicate send incidents
 * - Exponential backoff still uses Thread.sleep (TODO: convert to async in v2.1)
 */
@Service
public class EmailOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(EmailOrchestrator.class);

    private static final int PRIMARY_MAX_ATTEMPTS = 3;
    private static final int FALLBACK_MAX_ATTEMPTS = 2;
    private static final long RETRY_DELAY_MS = 1000;
    private static final long DEDUP_TTL_SECONDS = 300;

    private final EmailProvider primaryProvider;
    private final EmailProvider fallbackProvider;

    private final ConcurrentHashMap<String, Instant> sentCache = new ConcurrentHashMap<>();

    public EmailOrchestrator(BrevoEmailService primaryProvider,
                             MailerSendEmailService fallbackProvider) {
        this.primaryProvider = primaryProvider;
        this.fallbackProvider = fallbackProvider;
        log.info("EmailOrchestrator initialized: primary={}, fallback={}", 
            primaryProvider.name(), fallbackProvider.name());
    }

    /**
     * Send email with automatic fallback and deduplication.
     * Throws EmailDeliveryException if all providers fail.
     *
     * @throws EmailDeliveryException if both primary and fallback exhausted
     */
    public void send(String to, String subject, String text, String html) {
        String dedupKey = computeDedupKey(to, subject, text);

        if (isDuplicate(dedupKey)) {
            log.info("Duplicate email suppressed — dedupKey={}, to={}", dedupKey, to);
            return;
        }

        log.info("EmailOrchestrator: Starting send attempt — to={}, subject={}", to, subject);

        boolean primarySuccess = tryProvider(primaryProvider, to, subject, text, html, PRIMARY_MAX_ATTEMPTS);
        if (primarySuccess) {
            markSent(dedupKey);
            return;
        }

        log.warn("Primary provider {} exhausted after {} attempts — attempting fallback {}",
            primaryProvider.name(), PRIMARY_MAX_ATTEMPTS, fallbackProvider.name());

        boolean fallbackSuccess = tryProvider(fallbackProvider, to, subject, text, html, FALLBACK_MAX_ATTEMPTS);
        if (fallbackSuccess) {
            markSent(dedupKey);
            return;
        }

        String msg = String.format(
            "All email providers failed — primary=%s (attempts=%d), fallback=%s (attempts=%d), recipient=%s",
            primaryProvider.name(), PRIMARY_MAX_ATTEMPTS, fallbackProvider.name(), FALLBACK_MAX_ATTEMPTS, to);
        log.error(msg);
        throw new EmailDeliveryException(msg);
    }

    /**
     * Try provider with retry logic and exponential backoff.
     * 
     * @param provider Email provider to attempt
     * @param to Recipient email
     * @param subject Email subject
     * @param text Plain text body
     * @param html HTML body
     * @param maxAttempts Maximum attempts before giving up
     * @return true if provider accepted the email (2xx response)
     */
    private boolean tryProvider(EmailProvider provider, String to, String subject,
                                 String text, String html, int maxAttempts) {
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Production fix: Log at INFO level for observability
                log.info("{}: Attempt {}/{} — recipient={}, subject={}", 
                    provider.name(), attempt, maxAttempts, to, subject);
                
                boolean ok = provider.send(to, subject, text, html);
                if (ok) {
                    log.info("{}: Success on attempt {}/{}", provider.name(), attempt, maxAttempts);
                    return true;
                }
                
                log.warn("{}: Non-success response on attempt {}/{}", provider.name(), attempt, maxAttempts);
            } catch (Exception ex) {
                log.warn("{}: Attempt {}/{} failed — {}: {}", 
                    provider.name(), attempt, maxAttempts, ex.getClass().getSimpleName(), ex.getMessage());
            }

            // Exponential backoff before retry: 1s, 2s, 4s, etc.
            if (attempt < maxAttempts) {
                long delay = RETRY_DELAY_MS * (1L << (attempt - 1));
                log.debug("{}: Waiting {}ms before next attempt", provider.name(), delay);
                try {
                    Thread.sleep(delay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    log.error("{}: Interrupted during backoff", provider.name());
                    return false;
                }
            }
        }
        log.error("{}: All {} attempts exhausted", provider.name(), maxAttempts);
        return false;
    }

    private String computeDedupKey(String to, String subject, String text) {
        return String.valueOf((to + "|" + subject + "|" + text).hashCode());
    }

    private boolean isDuplicate(String key) {
        Instant expiry = sentCache.get(key);
        if (expiry == null) return false;
        if (Instant.now().isAfter(expiry)) {
            sentCache.remove(key);
            return false;
        }
        return true;
    }

    private void markSent(String key) {
        sentCache.put(key, Instant.now().plus(Duration.ofSeconds(DEDUP_TTL_SECONDS)));
    }
}
