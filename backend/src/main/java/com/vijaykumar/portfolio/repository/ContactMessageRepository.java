package com.vijaykumar.portfolio.repository;

import com.vijaykumar.portfolio.entity.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Contact Message Repository — JPA repository for ContactMessage entity.
 * 
 * Provides basic CRUD operations via JpaRepository.
 * Custom queries for admin/analytics purposes.
 */
@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {

    /**
     * Finds messages where email notification was not sent.
     * Useful for retrying failed email deliveries.
     */
    @Query("SELECT c FROM ContactMessage c WHERE c.emailSent = false AND c.createdAt > ?1")
    List<ContactMessage> findUnsentMessagesSince(LocalDateTime since);

    /**
     * Count messages received in the last 24 hours.
     * Useful for rate limiting analysis.
     */
    @Query("SELECT COUNT(c) FROM ContactMessage c WHERE c.createdAt > ?1")
    long countSince(LocalDateTime since);
}
