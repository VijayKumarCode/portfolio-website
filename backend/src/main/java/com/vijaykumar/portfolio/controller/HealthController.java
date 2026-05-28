package com.vijaykumar.portfolio.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

/**
 * Health Controller — Production Health Check Endpoints
 * * Configured to resolve both explicit api health checks and automated 
 * load-balancer container layer pings from Render infrastructure.
 */
@RestController
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);
    private final DataSource dataSource;

    public HealthController(@Autowired(required = false) DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Intercepts absolute root domain pings from deployment platforms.
     * Maps to: GET /
     * Resolves the remaining background 404 routing trace logs.
     */
    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> platformRootCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ONLINE");
        response.put("message", "Vijay Kumar Portfolio API Gateway Core Operating Normally.");
        return ResponseEntity.ok(response);
    }

    /**
     * Liveness probe — indicates the application process is running.
     * Maps to: GET /api/v1/health
     */
    @GetMapping({"/api/v1/health", "/api/v1/health/"})
    public ResponseEntity<Map<String, Object>> liveness() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "portfolio-backend");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    /**
     * Readiness probe — indicates the application is ready to accept user data requests.
     * Maps to: GET /api/v1/health/ready
     */
    @GetMapping("/api/v1/health/ready")
    public ResponseEntity<Map<String, Object>> readiness() {
        Map<String, Object> response = new HashMap<>();
        
        boolean dbHealthy = checkDatabaseHealth();
        
        response.put("status", dbHealthy ? "UP" : "DEGRADED");
        response.put("database", dbHealthy ? "UP" : "DOWN");
        response.put("timestamp", System.currentTimeMillis());
        
        if (dbHealthy) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(503).body(response);
        }
    }

    /**
     * Database status probe — explicitly verifies connection pool availability.
     * Maps to: GET /api/v1/health/db
     */
    @GetMapping("/api/v1/health/db")
    public ResponseEntity<Map<String, Object>> databaseHealth() {
        Map<String, Object> response = new HashMap<>();
        
        boolean healthy = checkDatabaseHealth();
        response.put("database", healthy ? "UP" : "DOWN");
        response.put("pool", dataSource != null ? dataSource.getClass().getSimpleName() : "unknown");
        
        if (healthy) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(503).body(response);
        }
    }

    /**
     * Validates database infrastructure connectivity with a safe timeout fence.
     */
    private boolean checkDatabaseHealth() {
        if (dataSource == null) {
            log.warn("Health check diagnostic: DataSource dependency injection missing or unavailable");
            return false;
        }
        
        try (Connection connection = dataSource.getConnection()) {
            boolean valid = connection.isValid(5); // 5-second validation boundary
            if (!valid) {
                log.warn("Health check diagnostic: Database connection validation pool timeout failed");
            }
            return valid;
        } catch (SQLException e) {
            log.warn("Health check diagnostic: Critical database link fault: {}", e.getMessage());
            return false;
        }
    }
}