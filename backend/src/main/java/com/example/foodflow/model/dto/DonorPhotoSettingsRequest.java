package com.example.foodflow.model.dto;

import com.example.foodflow.model.types.PhotoDisplayType;

import java.util.Map;

public class DonorPhotoSettingsRequest {
    private PhotoDisplayType displayType;
    private Long singleImageId;
    private Long singleLibraryImageId;
    private Map<String, Long> perFoodTypeMap;
    private Map<String, Long> perFoodTypeLibraryMap;

    public PhotoDisplayType getDisplayType() {
        return displayType;
    }

    public void setDisplayType(PhotoDisplayType displayType) {
        this.displayType = displayType;
    }

    public Long getSingleImageId() {
        return singleImageId;
    }

    public void setSingleImageId(Long singleImageId) {
        this.singleImageId = singleImageId;
    }

    public Long getSingleLibraryImageId() {
        return singleLibraryImageId;
    }

    public void setSingleLibraryImageId(Long singleLibraryImageId) {
        this.singleLibraryImageId = singleLibraryImageId;
    }

    public Map<String, Long> getPerFoodTypeMap() {
        return perFoodTypeMap;
    }

    public void setPerFoodTypeMap(Map<String, Long> perFoodTypeMap) {
        this.perFoodTypeMap = perFoodTypeMap;
    }

    public Map<String, Long> getPerFoodTypeLibraryMap() {
        return perFoodTypeLibraryMap;
    }

    public void setPerFoodTypeLibraryMap(Map<String, Long> perFoodTypeLibraryMap) {
        this.perFoodTypeLibraryMap = perFoodTypeLibraryMap;
    }
}
