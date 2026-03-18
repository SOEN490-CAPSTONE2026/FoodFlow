package com.example.foodflow.model.dto;
import com.example.foodflow.model.entity.UserRole;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data //handles getters, setters, toString, equals, and hashCode
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDTO {
    private Long id;
    private String email;
    @JsonIgnore
    private String password;
    private UserRole role;
    private OrganizationDTO organization;
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
    private String languagePreference;
    private Boolean emailNotificationsEnabled;
    private Boolean smsNotificationsEnabled;

    public static UserDTO toDTO(com.example.foodflow.model.entity.User user) {
        if (user == null) return null;
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setOrganization(OrganizationDTO.toDTOWithoutUser(user.getOrganization()));
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setLanguagePreference(user.getLanguagePreference());
        dto.setEmailNotificationsEnabled(user.getEmailNotificationsEnabled());
        dto.setSmsNotificationsEnabled(user.getSmsNotificationsEnabled());
        return dto;
    }

    public static UserDTO toDTOWithoutOrganization(com.example.foodflow.model.entity.User user) {
        if (user == null) return null;
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setLanguagePreference(user.getLanguagePreference());
        dto.setEmailNotificationsEnabled(user.getEmailNotificationsEnabled());
        dto.setSmsNotificationsEnabled(user.getSmsNotificationsEnabled());
        return dto;
    }
}
