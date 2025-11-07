package com.example.foodflow.model.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Data //handles getters, setters, toString, equals, and hashCode
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SurplusPostDTO {
    private Long id;
    private String type;
    private String quantity;
    @JsonProperty("expiry_date")
    private LocalDateTime expiryDate;
    @JsonProperty("pickup_time")
    private LocalDateTime pickupTime;
    private String location;
    private UserDTO donor;
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

public static SurplusPostDTO toDTO(com.example.foodflow.model.entity.SurplusPost post) {
    if (post == null) return null;

    SurplusPostDTO dto = new SurplusPostDTO();
    dto.setId(post.getId());

    // Convert Set<FoodCategory> to comma-separated string
    dto.setType(post.getFoodCategories() != null && !post.getFoodCategories().isEmpty() 
        ? post.getFoodCategories().stream()
            .map(Enum::name)
            .collect(Collectors.joining(", "))
        : null);
    
    dto.setQuantity(post.getQuantity() != null ? post.getQuantity().toString() : null);
    dto.setExpiryDate(post.getExpiryDate() != null ? post.getExpiryDate().atStartOfDay() : null);
    
    // Combine pickupDate and pickupFrom to create LocalDateTime
    dto.setPickupTime(post.getPickupDate() != null && post.getPickupFrom() != null
        ? post.getPickupDate().atTime(post.getPickupFrom())
        : null);

    // Extract address from Location object
    dto.setLocation(post.getPickupLocation() != null ? post.getPickupLocation().getAddress() : null);
    
    dto.setDonor(UserDTO.toDTO(post.getDonor()));
    dto.setCreatedAt(post.getCreatedAt());
    dto.setUpdatedAt(post.getUpdatedAt());

    return dto;
}

}
