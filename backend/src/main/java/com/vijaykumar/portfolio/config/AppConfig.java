package com.vijaykumar.portfolio.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Central application configuration.
 *
 * RestTemplate is configured with explicit connection and read timeouts
 * to prevent hanging threads when email providers are slow or unreachable.
 * Render free tier (512MB) cannot afford blocked threads.
 */
@Configuration
public class AppConfig {

    /**
     * Production-grade RestTemplate with defensive timeouts.
     * Connection timeout: 5s — fail fast if provider is unreachable.
     * Read timeout: 10s — fail fast if provider is slow.
     */
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);  // 5 seconds
        factory.setReadTimeout(10000);    // 10 seconds
        return new RestTemplate(factory);
    }
}
