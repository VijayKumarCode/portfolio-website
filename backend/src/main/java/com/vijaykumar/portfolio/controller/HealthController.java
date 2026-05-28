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
 * * Handles base domain sweeps and specific subpath monitoring signals natively.
 */
@RestController
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);
    private final DataSource dataSource;

    public HealthController(@Autowired(required = false) DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Intercepts plain proxy pings hitting your base app link.
     * Maps to: GET /
     */
    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> platformRootCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ONLINE");
        response.put("message", "Vijay Kumar Portfolio API Gateway Core Operating Normally.");
        return ResponseEntity.ok(response);
    }

    /**
     * Liveness probe — maps directly to GET /api/v1/health
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
     * Readiness probe — maps to GET /api/v1/health/ready
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
     * Database status probe — maps to GET /api/v1/health/db
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

    private boolean checkDatabaseHealth() {
        if (dataSource == null) {
            log.warn("Health check diagnostic: DataSource injection missing or unavailable");
            return false;
        }
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(5);
        } catch (SQLException e) {
            log.warn("Health check diagnostic: Critical database link fault: {}", e.getMessage());
            return false;
        }
    }
}