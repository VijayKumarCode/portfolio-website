package com.vijaykumar.portfolio.email;

import com.vijaykumar.portfolio.dto.ContactFormDto;

/**
 * Common interface for email notification delivery channels.
 */
public interface EmailProvider {
    EmailSendResult sendContactNotification(ContactFormDto dto);
    String getProviderName();
}
