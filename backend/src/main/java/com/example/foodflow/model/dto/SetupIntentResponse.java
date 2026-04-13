package com.example.foodflow.model.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetupIntentResponse {
    private String clientSecret;
    private String setupIntentId;
    private String status;
    private String message;
}
