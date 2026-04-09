package com.vijaykumar.portfolio.config;
 
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
 
/**
 * Central application configuration.
 *
 * BUG FIX — CRITICAL:
 * RestTemplate was used via @RequiredArgsConstructor injection in
 * ContactService but was never declared as a @Bean anywhere.
 * Spring cannot inject it without a bean definition — the app
 * would crash at startup with:
 *   "Parameter 1 of constructor in ContactService required a bean
 *    of type RestTemplate that could not be found."
 *
 * Additionally, a file named restTemplate.java existed in the
 * service package (public class restTemplate {}). This caused
 * Spring's component scan to create a bean of type restTemplate
 * (lowercase) which did NOT satisfy the RestTemplate injection
 * point. DELETE that file entirely.
 */
@Configuration
public class AppConfig {
 
    /**
     * Shared RestTemplate instance for all HTTP calls.
     * Declared as a @Bean so Spring manages its lifecycle and
     * it can be injected anywhere via constructor injection.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}