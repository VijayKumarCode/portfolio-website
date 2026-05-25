package com.vijaykumar.portfolio.email;

public record EmailSendResult(
    boolean success,
    int statusCode,
    String message,
    boolean retryable,
    String responseBody
) {
    // Overloaded constructor for Brevo (2 arguments)
    public EmailSendResult(boolean success, String message) {
        this(success, success ? 200 : 500, message, !success, message);
    }

    // Overloaded constructor for MailerSend (3 arguments)
    public EmailSendResult(boolean success, boolean retryable, String responseBody) {
        this(success, success ? 200 : 500, "Processed", retryable, responseBody);
    }
}