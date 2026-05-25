package com.vijaykumar.portfolio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Portfolio Service Application — Spring Boot Entry Point
 * 
 * OPTIMIZATIONS:
 * 1. @EnableAsync is used instead of XML configuration
 * 2. Component scan is limited to the portfolio package
 * 3. Auto-configuration exclusions can be added if needed
 * 
 * STARTUP TIME OPTIMIZATIONS (configured in properties):
 * - Hibernate ddl-auto=none (no schema validation)
 * - Lazy initialization disabled (better for Render free tier)
 * - Minimal auto-configuration
 */
@SpringBootApplication
@EnableAsync
public class PortfolioServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortfolioServiceApplication.class, args);
    }
}

