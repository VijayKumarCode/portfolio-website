package com.vijaykumar.portfolio.service.email;

import com.vijaykumar.portfolio.exception.EmailDeliveryException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
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
 */
@Slf4j
@Service
public class EmailOrchestrator {

    private static final int PRIMARY_MAX_ATTEMPTS = 3;   // Brevo: initial + 2 retries
    private static final int FALLBACK_MAX_ATTEMPTS = 2;  // MailerSend: initial + 1 retry
    private static final long RETRY_DELAY_MS = 1000;     // 1s between retries
    private static final long DEDUP_TTL_SECONDS = 300;   // 5 minutes

    private final EmailProvider primaryProvider;
    private final EmailProvider fallbackProvider;

    /** Deduplication cache: content hash -> expiry timestamp */
    private final ConcurrentHashMap<String, Instant> sentCache = new ConcurrentHashMap<>();

    public EmailOrchestrator(BrevoEmailService primaryProvider,
                             MailerSendEmailService fallbackProvider) {
        this.primaryProvider = primaryProvider;
        this.fallbackProvider = fallbackProvider;
    }

    /**
     * Send an email with automatic provider fallback and deduplication.
     *
     * @param to      recipient
     * @param subject subject line
     * @param text    plain text body
     * @param html    HTML body (nullable)
     * @throws EmailDeliveryException if both providers fail
     */
    public void send(String to, String subject, String text, String html) {
        String dedupKey = computeDedupKey(to, subject, text);

        if (isDuplicate(dedupKey)) {
            log.info("Duplicate email suppressed — dedupKey={}", dedupKey);
            return;
        }

        // ── Attempt PRIMARY (Brevo) ─────────────────────────────
        boolean primarySuccess = tryProvider(primaryProvider, to, subject, text, html, PRIMARY_MAX_ATTEMPTS);
        if (primarySuccess) {
            markSent(dedupKey);
            return;
        }

        log.warn("Primary provider {} exhausted — attempting fallback {}",
            primaryProvider.name(), fallbackProvider.name());

        // ── Attempt FALLBACK (MailerSend) ───────────────────────
        boolean fallbackSuccess = tryProvider(fallbackProvider, to, subject, text, html, FALLBACK_MAX_ATTEMPTS);
        if (fallbackSuccess) {
            markSent(dedupKey);
            return;
        }

        // ── Both failed ─────────────────────────────────────────
        String msg = String.format(
            "All email providers failed — primary=%s, fallback=%s, recipient=%s",
            primaryProvider.name(), fallbackProvider.name(), to);
        log.error(msg);
        throw new EmailDeliveryException(msg);
    }

    /**
     * Attempt to send via a provider with retries and exponential backoff.
     */
    private boolean tryProvider(EmailProvider provider, String to, String subject,
                                 String text, String html, int maxAttempts) {
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                log.debug("{} attempt {}/{} — to={}", provider.name(), attempt, maxAttempts, to);
                boolean ok = provider.send(to, subject, text, html);
                if (ok) return true;
            } catch (Exception ex) {
                log.warn("{} attempt {}/{} failed — {}", provider.name(), attempt, maxAttempts, ex.getMessage());
            }

            if (attempt < maxAttempts) {
                long delay = RETRY_DELAY_MS * (1L << (attempt - 1)); // 1s, 2s, 4s...
                try {
                    Thread.sleep(delay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return false;
                }
            }
        }
        return false;
    }

    private String computeDedupKey(String to, String subject, String text) {
        // Simple hash of content — sufficient for contact form dedup
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

