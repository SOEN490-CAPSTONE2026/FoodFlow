package com.example.foodflow.model.dto;
import com.example.foodflow.model.types.PaymentMethodType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodResponse {
    private Long id;
    private String stripePaymentMethodId;
    private PaymentMethodType paymentMethodType;
    private String cardBrand;
    private String cardLast4;
    private Integer cardExpMonth;
    private Integer cardExpYear;
    private String bankName;
    private String bankLast4;
    private Boolean isDefault;
    private LocalDateTime createdAt;
}
