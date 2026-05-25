package com.vijaykumar.portfolio.email;

public record EmailDeliveryReport(
    boolean delivered,
    String providerUsed,
    String diagnosticMessage,
    long durationMs
) {
    // Overloaded constructor to support 3-argument creations gracefully
    public EmailDeliveryReport(boolean delivered, String providerUsed, String diagnosticMessage) {
        this(delivered, providerUsed, diagnosticMessage, 0L);
    }
}
