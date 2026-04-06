package com.example.foodflow.model.entity;
import com.example.foodflow.model.types.RefundStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity
@Table(name = "refunds")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Refund {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;
    @Column(name = "stripe_refund_id", unique = true)
    private String stripeRefundId;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;
    @Column(length = 255)
    private String reason;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private RefundStatus status;
    @Column(name = "processed_at")
    private LocalDateTime processedAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by")
    private User requestedBy;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
