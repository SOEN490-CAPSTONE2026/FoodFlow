package com.example.foodflow.model.dto;
import com.example.foodflow.model.entity.OrganizationType;
import com.example.foodflow.model.entity.VerificationStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrganizationDTO {
    private Long id;
    private UserDTO user;
    private String name;
    @JsonProperty("contact_person")
    private String contactPerson;
    private String phone;
    private String address;
    @JsonProperty("organization_type")
    private OrganizationType organizationType;
    private Integer capacity;
    @JsonProperty("business_license")
    private String businessLicense;
    @JsonProperty("verification_status")
    private VerificationStatus verificationStatus;
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    // Getters/Setters omitted for brevity

    public static OrganizationDTO toDTO(com.example.foodflow.model.entity.Organization org) {
        if (org == null) return null;
        OrganizationDTO dto = new OrganizationDTO();
        dto.setId(org.getId());
        dto.setUser(UserDTO.toDTO(org.getUser()));
        dto.setName(org.getName());
        dto.setContactPerson(org.getContactPerson());
        dto.setPhone(org.getPhone());
        dto.setAddress(org.getAddress());
        dto.setOrganizationType(org.getOrganizationType());
        dto.setCapacity(org.getCapacity());
        dto.setBusinessLicense(org.getBusinessLicense());
        dto.setVerificationStatus(org.getVerificationStatus());
        dto.setCreatedAt(org.getCreatedAt());
        return dto;
    }
}
