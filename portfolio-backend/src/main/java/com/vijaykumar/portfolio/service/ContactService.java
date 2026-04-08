package com.vijaykumar.portfolio.service;

import com.vijaykumar.portfolio.model.ContactRequest;
import com.vijaykumar.portfolio.entity.ContactMessage;
import com.vijaykumar.portfolio.repository.ContactRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class ContactService {

    private final ContactRepository repository;
    private final RestTemplate restTemplate;

    // These will be pulled from Render Environment Variables
    @Value("${RESEND_API_KEY}")
    private String resendApiKey;

    @Value("${app.notify-email}")
    private String notifyEmail;

    @Value("${app.mail-from}")
    private String mailFrom;

    public ContactService(ContactRepository repository) {
        this.repository = repository;
        this.restTemplate = new RestTemplate();
    }

    public void saveMessage(ContactRequest request) {
        // 1. Save to Database (Standard logic)
        ContactMessage entity = new ContactMessage(
                request.name(),
                request.email(),
                request.message()
        );
        repository.save(entity);

        // 2. Trigger Email Notification
        sendEmailNotification(request);
    }

    private void sendEmailNotification(ContactRequest request) {
        String url = "https://api.resend.com/emails";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        // Prepare the Email Body
        Map<String, Object> body = new HashMap<>();
        body.put("from", "Portfolio Alert <" + mailFrom + ">");
        body.put("to", notifyEmail);
        body.put("subject", "New Message from " + request.name());
        body.put("html", String.format(
            "<h3>New Portfolio Submission</h3>" +
            "<p><strong>Name:</strong> %s</p>" +
            "<p><strong>Email:</strong> %s</p>" +
            "<p><strong>Message:</strong> %s</p>",
            request.name(), request.email(), request.message()
        ));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForEntity(url, entity, String.class);
        } catch (Exception e) {
            // We log the error but don't stop the user's form from succeeding
            System.err.println("Email failed to send: " + e.getMessage());
        }
    }
}