package com.vijaykumar.portfolio.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web / CORS Configuration
 *
 * ─── BUGS FIXED ─────────────────────────────────────────────────────────────
 *
 * BUG 1 (HIGH — contact form blocked):
 *   Original default value only included 'https://www.vijaykumarcode.space'
 *   and 'http://localhost:3000'.
 *   Missing origins that cause CORS failures:
 *     - https://vijaykumarcode.space  (canonical non-www — both are live)
 *     - http://localhost:5500          (python3 -m http.server 5500 — per README)
 *   FIX: Added both missing origins to the default value.
 *
 * BUG 2 (LOW — restrictive header allowlist):
 *   Original allowed: Content-Type, Authorization, X-Requested-With
 *   The frontend contact.js sends only 'Content-Type: application/json'.
 *   'Authorization' is not used by the frontend — not harmful to keep.
 *   No change needed here, but documented for clarity.
 *
 * ─── DEPLOYMENT NOTE ────────────────────────────────────────────────────────
 *   In production (Render), set the environment variable:
 *     CORS_ALLOWED_ORIGINS=https://vijaykumarcode.space,https://www.vijaykumarcode.space
 *   This overrides the default value below.
 *   The default value is used for local development only.
 */
@Configuration
public class WebConfig {

    /**
     * Comma-separated list of allowed origins.
     *
     * Default includes:
     *   - Both www and non-www live domains (vijaykumarcode.space is canonical per meta tag)
     *   - localhost:5500 for python3 http.server (per README local dev instructions)
     *   - localhost:8080 for when frontend is served alongside backend in dev
     *
     * Override in Render environment variables:
     *   CORS_ALLOWED_ORIGINS=https://vijaykumarcode.space,https://www.vijaykumarcode.space
     */
    @Value("${cors.allowed-origins:" +
           "https://vijaykumarcode.space," +
           "https://www.vijaykumarcode.space," +
           "http://localhost:5500," +
           "http://localhost:8080," +
           "http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                String[] origins = allowedOrigins.split(",");

                // Contact form and all API endpoints
                registry.addMapping("/api/**")
                        .allowedOrigins(origins)
                        .allowedMethods("GET", "POST", "OPTIONS")
                        .allowedHeaders("Content-Type", "Authorization", "X-Requested-With")
                        .allowCredentials(true)
                        .maxAge(3600);

                // Health check — allow all origins (used by cron-job.org, UptimeRobot, etc.)
                registry.addMapping("/api/v1/health/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET");
            }
        };
    }
}