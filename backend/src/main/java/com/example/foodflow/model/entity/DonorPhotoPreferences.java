package com.example.foodflow.model.entity;

import com.example.foodflow.model.types.PhotoDisplayType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "donor_photo_preferences")
public class DonorPhotoPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false, unique = true)
    private User donor;

    @Enumerated(EnumType.STRING)
    @Column(name = "display_type", nullable = false)
    private PhotoDisplayType displayType = PhotoDisplayType.SINGLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "single_image_id")
    private DonationImage singleImage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "single_library_image_id")
    private InternalImageLibrary singleLibraryImage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "per_food_type_map", nullable = false)
    private String perFoodTypeMap = "{}";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "per_food_type_library_map", nullable = false)
    private String perFoodTypeLibraryMap = "{}";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (displayType == null) {
            displayType = PhotoDisplayType.SINGLE;
        }
        if (perFoodTypeMap == null || perFoodTypeMap.isBlank()) {
            perFoodTypeMap = "{}";
        }
        if (perFoodTypeLibraryMap == null || perFoodTypeLibraryMap.isBlank()) {
            perFoodTypeLibraryMap = "{}";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (displayType == null) {
            displayType = PhotoDisplayType.SINGLE;
        }
        if (perFoodTypeMap == null || perFoodTypeMap.isBlank()) {
            perFoodTypeMap = "{}";
        }
        if (perFoodTypeLibraryMap == null || perFoodTypeLibraryMap.isBlank()) {
            perFoodTypeLibraryMap = "{}";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getDonor() {
        return donor;
    }

    public void setDonor(User donor) {
        this.donor = donor;
    }

    public PhotoDisplayType getDisplayType() {
        return displayType;
    }

    public void setDisplayType(PhotoDisplayType displayType) {
        this.displayType = displayType;
    }

    public DonationImage getSingleImage() {
        return singleImage;
    }

    public void setSingleImage(DonationImage singleImage) {
        this.singleImage = singleImage;
    }

    public InternalImageLibrary getSingleLibraryImage() {
        return singleLibraryImage;
    }

    public void setSingleLibraryImage(InternalImageLibrary singleLibraryImage) {
        this.singleLibraryImage = singleLibraryImage;
    }

    public String getPerFoodTypeMap() {
        return perFoodTypeMap;
    }

    public void setPerFoodTypeMap(String perFoodTypeMap) {
        this.perFoodTypeMap = perFoodTypeMap;
    }

    public String getPerFoodTypeLibraryMap() {
        return perFoodTypeLibraryMap;
    }

    public void setPerFoodTypeLibraryMap(String perFoodTypeLibraryMap) {
        this.perFoodTypeLibraryMap = perFoodTypeLibraryMap;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
