package com.vijaykumar.portfolio.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Database Schema Initializer — Idempotent column migration for contact_messages.
 *
 * Ensures all JPA entity columns exist in production PostgreSQL before the first
 * contact form submission hits the database.
 *
 * ─── BUGS FIXED IN THIS VERSION ────────────────────────────────────────────
 *
 * BUG 1 (CRITICAL — production crash):
 *   Original executeUpdate() called conn.commit() unconditionally.
 *   Neon PostgreSQL via HikariCP defaults to autoCommit=true.
 *   PostgreSQL JDBC throws PSQLException("Cannot commit when autoCommit is enabled")
 *   when commit() is called on an auto-commit connection.
 *   This caused initializeSchema() to throw RuntimeException, crashing the
 *   ApplicationReadyEvent listener and preventing schema migration from ever running.
 *   FIX: Only call commit() when autoCommit is false.
 *
 * BUG 2 (CRITICAL — production failure):
 *   Original only added email_sent and email_provider columns.
 *   ContactMessage entity also requires 'subject' column (nullable=false).
 *   If 'subject' column is absent, every INSERT fails with:
 *     ERROR: null value in column "subject" violates not-null constraint
 *   FIX: Added subject column migration with a safe DEFAULT value.
 *
 * BUG 3 (MEDIUM — silent app failure):
 *   Original re-threw RuntimeException from @EventListener(ApplicationReadyEvent.class).
 *   In Spring Boot 3, this propagates through SpringApplication.run() and may
 *   cause Render to see a failed startup and restart the container in a crash loop.
 *   FIX: Log the error and continue. Schema migration failure should NOT kill
 *   the application — the error is surfaced clearly in logs for operator action.
 *   A proper DATABASE_MIGRATION.sql file handles the schema as the authoritative fix.
 */
@Component
public class DatabaseSchemaInitializer {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaInitializer.class);
    private final DataSource dataSource;

    public DatabaseSchemaInitializer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Runs after Spring context is fully started.
     * Does NOT throw — schema migration failure is logged but does not crash the app.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void initializeSchema() {
        try {
            ensureContactMessagesSchemaIsComplete();
            log.info("Database schema initialization completed successfully");
        } catch (Exception e) {
            // LOG but do NOT re-throw.
            // Re-throwing here propagates through SpringApplication.run() on Render
            // and causes a crash-loop restart. The correct fix is to run
            // DATABASE_MIGRATION.sql manually against the Neon database.
            log.error("Schema initializer failed — run DATABASE_MIGRATION.sql manually: {}", e.getMessage(), e);
        }
    }

    private void ensureContactMessagesSchemaIsComplete() throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();

            // Add subject column (required by ContactMessage entity, nullable=false)
            if (!columnExists(meta, "contact_messages", "subject")) {
                log.warn("Column 'subject' missing — adding with DEFAULT 'Website Contact Message'");
                executeUpdate(conn,
                    "ALTER TABLE contact_messages " +
                    "ADD COLUMN subject VARCHAR(200) NOT NULL DEFAULT 'Website Contact Message'");
                log.info("Column 'subject' added successfully");
            }

            // Add email_sent column
            if (!columnExists(meta, "contact_messages", "email_sent")) {
                log.warn("Column 'email_sent' missing — adding");
                executeUpdate(conn,
                    "ALTER TABLE contact_messages " +
                    "ADD COLUMN email_sent BOOLEAN NOT NULL DEFAULT FALSE");
                log.info("Column 'email_sent' added successfully");
            }

            // Add email_provider column
            if (!columnExists(meta, "contact_messages", "email_provider")) {
                log.warn("Column 'email_provider' missing — adding");
                executeUpdate(conn,
                    "ALTER TABLE contact_messages " +
                    "ADD COLUMN email_provider VARCHAR(20)");
                log.info("Column 'email_provider' added successfully");
            }

            // Ensure indexes exist
            executeIgnoreError(conn,
                "CREATE INDEX IF NOT EXISTS idx_created_at ON contact_messages(created_at)");
            executeIgnoreError(conn,
                "CREATE INDEX IF NOT EXISTS idx_email_sent  ON contact_messages(email_sent)");

            log.info("Schema validation complete — all required columns present");
        }
    }

    private boolean columnExists(DatabaseMetaData meta, String table, String column) throws Exception {
        try (ResultSet rs = meta.getColumns(null, null, table, column)) {
            return rs.next();
        }
    }

    /**
     * Executes a DDL statement.
     *
     * FIX: Calls conn.commit() only when autoCommit is false.
     * When autoCommit=true (HikariCP default), PostgreSQL auto-commits DDL statements.
     * Calling commit() explicitly on an auto-commit connection throws:
     *   PSQLException: Cannot commit when autoCommit is enabled
     */
    private void executeUpdate(Connection conn, String sql) throws Exception {
        try (Statement stmt = conn.createStatement()) {
            stmt.executeUpdate(sql);
            // Only commit manually when not in auto-commit mode
            if (!conn.getAutoCommit()) {
                conn.commit();
            }
        }
    }

    /**
     * Like executeUpdate but swallows exceptions (for idempotent operations like CREATE INDEX IF NOT EXISTS).
     */
    private void executeIgnoreError(Connection conn, String sql) {
        try {
            executeUpdate(conn, sql);
        } catch (Exception e) {
            log.debug("Non-fatal DDL note: {}", e.getMessage());
        }
    }
}