package com.vijaykumar.portfolio.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Contact Message Entity — Database entity for storing contact form submissions.
 * 
 * This entity tracks:
 * - Form submission details (name, email, subject, message)
 * - Email delivery status (whether notification was sent)
 * - Which provider delivered the email (for analytics/debugging)
 * - Timestamp for record keeping
 */
@Entity
@Table(name = "contact_messages", indexes = {
    @Index(name = "idx_created_at", columnList = "created_at"),
    @Index(name = "idx_email_sent", columnList = "email_sent")
})
public class ContactMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "email", nullable = false, length = 254)
    private String email;

    @Column(name = "subject", nullable = false, length = 200)
    private String subject;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "email_sent", nullable = false)
    private Boolean emailSent = false;

    @Column(name = "email_provider", length = 20)
    private String emailProvider;

    // Constructors
    public ContactMessage() {}

    // Getters and Setters
    public Long getId() {
        return id; 
    }

    public void setId(Long id) {
        this.id = id; 
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getEmailSent() {
        return emailSent;
    }

    public void setEmailSent(Boolean emailSent) {
        this.emailSent = emailSent;
    }

    public String getEmailProvider() {
        return emailProvider;
    }

    public void setEmailProvider(String emailProvider) {
        this.emailProvider = emailProvider;
    }
}
