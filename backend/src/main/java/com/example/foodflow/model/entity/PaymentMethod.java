package com.example.foodflow.model.entity;

import com.example.foodflow.model.types.PaymentMethodType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_methods")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethod {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;
    
    @Column(name = "stripe_payment_method_id", unique = true, nullable = false)
    private String stripePaymentMethodId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method_type", nullable = false, length = 50)
    private PaymentMethodType paymentMethodType;
    
    @Column(name = "card_brand", length = 50)
    private String cardBrand;
    
    @Column(name = "card_last4", length = 4)
    private String cardLast4;
    
    @Column(name = "card_exp_month")
    private Integer cardExpMonth;
    
    @Column(name = "card_exp_year")
    private Integer cardExpYear;
    
    @Column(name = "bank_name")
    private String bankName;
    
    @Column(name = "bank_last4", length = 4)
    private String bankLast4;
    
    @Column(name = "is_default")
    private Boolean isDefault = false;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
