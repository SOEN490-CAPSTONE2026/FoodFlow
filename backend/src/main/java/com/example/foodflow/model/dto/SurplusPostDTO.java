package com.example.foodflow.model.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

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

    //dto.setType(post.getFoodType());  
    dto.setQuantity(post.getQuantity() != null ? post.getQuantity().toString() : null);
    dto.setExpiryDate(post.getExpiryDate() != null ? post.getExpiryDate().atStartOfDay() : null);
    //dto.setPickupTime(post.getPickupFrom());

    //dto.setLocation(post.getLocation());
    dto.setDonor(UserDTO.toDTO(post.getDonor()));
    dto.setCreatedAt(post.getCreatedAt());
    dto.setUpdatedAt(post.getUpdatedAt());

    return dto;
}

}
