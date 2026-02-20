package com.example.foodflow.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SavedDonationDTO {

    // ID of the saved_donations row
    @JsonProperty("saved_id")
    private Long savedId;

    @JsonProperty("saved_at")
    private LocalDateTime savedAt;

    // The actual surplus post that was saved
    private SurplusPostDTO post;

    public static SavedDonationDTO toDTO(
            com.example.foodflow.model.entity.SavedDonation savedDonation
    ) {
        if (savedDonation == null) return null;

        SavedDonationDTO dto = new SavedDonationDTO();
        dto.setSavedId(savedDonation.getId());
        dto.setSavedAt(savedDonation.getSavedAt());

        // Convert SurplusPost entity to existing SurplusPostDTO
        dto.setPost(
                SurplusPostDTO.toDTO(savedDonation.getSurplusPost())
        );

        return dto;
    }
}
