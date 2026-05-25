package com.vijaykumar.portfolio.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

/**
 * Health Controller — Production Health Check Endpoints
 * 
 * Render uses these to determine if the instance is healthy.
 * Also useful for external monitoring (UptimeRobot, etc.).
 * 
 * ENDPOINTS:
 * - GET /health → Basic liveness (always returns 200 if app is running)
 * - GET /health/ready → Readiness probe (checks DB connectivity)
 * - GET /health/db → Database connectivity check
 */
@RestController
@RequestMapping("/health")
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private final DataSource dataSource;

    public HealthController(@Autowired(required = false) DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Liveness probe — indicates the application is running.
     * Render uses this to determine if the container should be restarted.
     * Should be lightweight (no DB calls).
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> liveness() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "portfolio-backend");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    /**
     * Readiness probe — indicates the application is ready to serve traffic.
     * Checks database connectivity.
     * Render uses this to determine if the instance should receive requests.
     */
    @GetMapping("/ready")
    public ResponseEntity<Map<String, Object>> readiness() {
        Map<String, Object> response = new HashMap<>();
        
        // Check database
        boolean dbHealthy = checkDatabaseHealth();
        
        response.put("status", dbHealthy ? "UP" : "DEGRADED");
        response.put("database", dbHealthy ? "UP" : "DOWN");
        response.put("timestamp", System.currentTimeMillis());
        
        if (dbHealthy) {
            return ResponseEntity.ok(response);
        } else {
            // Return 503 to indicate the app isn't ready
            return ResponseEntity.status(503).body(response);
        }
    }

    /**
     * Database health check — attempts to get a connection from the pool.
     */
    @GetMapping("/db")
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
     * Attempts to validate the database connection.
     * Uses a short timeout to avoid hanging the health check.
     */
    private boolean checkDatabaseHealth() {
        if (dataSource == null) {
            log.warn("Health check: DataSource not available");
            return false;
        }
        
        try (Connection connection = dataSource.getConnection()) {
            // Execute a simple validation query
            boolean valid = connection.isValid(5);  // 5 second timeout
            if (!valid) {
                log.warn("Health check: Database connection validation failed");
            }
            return valid;
        } catch (SQLException e) {
            log.warn("Health check: Database connection failed: {}", e.getMessage());
            return false;
        }
    }
}

