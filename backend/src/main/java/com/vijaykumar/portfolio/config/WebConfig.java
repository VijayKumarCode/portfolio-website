package com.vijaykumar.portfolio.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;

@Configuration
public class WebConfig {

    private static final Logger log = LoggerFactory.getLogger(WebConfig.class);

    @Value("${CORS_ORIGIN:https://www.vijaykumarcode.space,https://vijaykumarcode.space,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Safely trim spaces and trailing slashes from dashboard configs
                String[] origins = Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .map(origin -> origin.replaceAll("/+$", ""))
                        .toArray(String[]::new);

                log.info("Initializing CORS mapping infrastructure. Allowed origins: {}", Arrays.toString(origins));
                
                // FIX: Map explicitly to /** to cover all API versions (/api/v1/contact, etc.) cleanly
                registry.addMapping("/**")
                        .allowedOrigins(origins)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*") // Allows headers like api-key to pass through unhindered
                        .exposedHeaders("Authorization")
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }
}