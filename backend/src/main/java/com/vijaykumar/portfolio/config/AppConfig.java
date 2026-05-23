package com.vijaykumar.portfolio.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Central application configuration for production deployment.
 *
 * Key Configurations:
 * 1. RestTemplate with defensive timeouts
 *    - Prevents hanging threads when email providers are slow/unreachable
 *    - Render free tier (512MB) cannot afford blocked threads
 *    - Timeouts configured aggressively for resource efficiency
 */
@Configuration
public class AppConfig {

    /**
     * Production-grade RestTemplate with defensive timeouts.
     *
     * Connection timeout: 5s
     *   - Fail fast if provider is unreachable
     *   - Prevents connection pool exhaustion
     *
     * Read timeout: 10s
     *   - Fail fast if provider is slow
     *   - Allows time for provider to respond (most APIs respond in 1-2s)
     *   - Prevents threads from blocking indefinitely
     *
     * PRODUCTION FIX:
     * - These timeouts prevent the contact form from hanging
     * - If Brevo times out, fallback to MailerSend immediately
     * - Render thread pool not exhausted by slow APIs
     */
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        
        // Connection timeout: 5 seconds
        // Time to establish TCP connection to provider
        factory.setConnectTimeout(5000);
        
        // Read timeout: 10 seconds
        // Time to receive first byte of response
        factory.setReadTimeout(10000);
        
        return new RestTemplate(factory);
    }
}
