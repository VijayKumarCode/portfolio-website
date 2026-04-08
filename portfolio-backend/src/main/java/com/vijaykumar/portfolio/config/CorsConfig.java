/* ═══════════════════════════════════════════════════════════
   Portfolio Backend v2.0 — CorsConfig.java
   Fixes:
   - BUG CRITICAL: Only allowed vijaykumarcode.vercel.app,
     NOT the custom domain vijaykumarcode.space — every contact
     form submission from the live site returned CORS error.
   - BUG: @CrossOrigin on ContactController conflicted with this
     global config. Removed @CrossOrigin from controller.
   - Added: environment variable support so origins can change
     without a code deploy.
═══════════════════════════════════════════════════════════ */
package com.vijaykumar.portfolio.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    /* Read from env var — no code change needed when domain changes */
    @Value("${cors.allowed-origin:https://vijaykumarcode.space}")
    private String allowedOrigin;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(
                            "http://127.0.0.1:5500",
                            "http://localhost:5500",
                            "http://localhost:3000",
                            "https://vijaykumarcode.vercel.app",   // legacy
                            "https://vijaykumarcode.space",        // BUG FIX: custom domain
                            "https://www.vijaykumarcode.space",    // www variant
                            allowedOrigin                          // env override
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true)
                        .maxAge(3600);  // cache preflight for 1 hour
            }
        };
    }
}