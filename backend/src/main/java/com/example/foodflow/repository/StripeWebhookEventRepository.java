package com.example.foodflow.repository;
import com.example.foodflow.model.entity.StripeWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Repository
public interface StripeWebhookEventRepository extends JpaRepository<StripeWebhookEvent, Long> {
    Optional<StripeWebhookEvent> findByStripeEventId(String stripeEventId);
    List<StripeWebhookEvent> findByProcessedFalseOrderByCreatedAtAsc();
    @Query("SELECT swe FROM StripeWebhookEvent swe WHERE swe.processed = false AND swe.createdAt < :before")
    List<StripeWebhookEvent> findStaleUnprocessedEvents(@Param("before") LocalDateTime before);
    List<StripeWebhookEvent> findByEventTypeOrderByCreatedAtDesc(String eventType);
    boolean existsByStripeEventId(String stripeEventId);
}
