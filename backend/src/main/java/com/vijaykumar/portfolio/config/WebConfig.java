package com.vijaykumar.portfolio.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web Configuration — CORS and general web settings
 * 
 * CORS is configured for the Vercel frontend domain.
 * In production, only https://www.vijaykumarcode.space is allowed.
 * 
 * FIX: Properly scoped CORS — no wildcard '*' in production.
 */
@Configuration
public class WebConfig {

    @Value("${cors.allowed-origins:https://www.vijaykumarcode.space,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Split comma-separated origins
                String[] origins = allowedOrigins.split(",");
                
                registry.addMapping("/api/**")
                        .allowedOrigins(origins)
                        .allowedMethods("GET", "POST", "OPTIONS")
                        .allowedHeaders("Content-Type", "Authorization", "X-Requested-With")
                        .allowCredentials(true)
                        .maxAge(3600); // Cache preflight for 1 hour
                
                // Health endpoint — allow broader access for monitoring
                registry.addMapping("/health/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET");
            }
        };
    }
}

