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

    // Reads CORS_ORIGIN to perfectly match your Render dashboard environment key
    @Value("${CORS_ORIGIN:https://www.vijaykumarcode.space,https://vijaykumarcode.space,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Trim trailing slashes and spaces from dashboard inputs safely
                String[] origins = Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .map(origin -> origin.replaceAll("/+$", ""))
                        .toArray(String[]::new);

                log.info("Initializing CORS mapping infrastructure. Allowed origins: {}", Arrays.toString(origins));
                
                registry.addMapping("/api/**")
                        .allowedOrigins(origins)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("Content-Type", "Authorization", "X-Requested-With", "Accept")
                        .exposedHeaders("Authorization")
                        .allowCredentials(true)
                        .maxAge(3600);
                
                // Keep health metrics exposed globally for Render engine checks
                registry.addMapping("/api/v1/health/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET");
            }
        };
    }
}