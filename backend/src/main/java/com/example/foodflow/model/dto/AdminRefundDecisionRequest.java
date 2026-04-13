package com.example.foodflow.model.dto;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminRefundDecisionRequest {
    @Size(max = 1000, message = "Admin notes cannot exceed 1000 characters")
    private String adminNotes;
}
