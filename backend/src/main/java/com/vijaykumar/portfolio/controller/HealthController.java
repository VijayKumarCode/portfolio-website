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
 * * Render uses these to determine if the instance is healthy.
 * Also useful for external monitoring (UptimeRobot, etc.).
 * * ENDPOINTS (REALIGNED FOR RENDER ROUTING):
 * - GET /api/v1/health → Basic liveness (Resolves Render's NoResourceFoundException)
 * - GET /api/v1/health/ready → Readiness probe (Checks database connectivity)
 * - GET /api/v1/health/db → Dedicated database connectivity status
 */
@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);
    private final DataSource dataSource;

    public HealthController(@Autowired(required = false) DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Liveness probe — indicates the application is up and running.
     * Maps directly to GET /api/v1/health to resolve platform deployment checks.
     */
    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> rootGreeting() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ONLINE");
        response.put("message", "Vijay Kumar Portfolio API Gateway Core Operating Normally.");
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> liveness() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "portfolio-backend");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    /**
     * Readiness probe — indicates the application is ready to accept production traffic.
     * Maps to GET /api/v1/health/ready
     */
    @GetMapping("/ready")
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
     * Database health check — explicitly verifies active connection pool status.
     * Maps to GET /api/v1/health/db
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
     * Validates database infrastructure connectivity with an isolated timeout barrier.
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