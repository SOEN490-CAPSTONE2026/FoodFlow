package com.example.foodflow.model.dto;
import com.example.foodflow.model.types.PhotoDisplayType;
import java.util.Map;
public class DonorPhotoSettingsResponse {
    private PhotoDisplayType displayType;
    private Long singleImageId;
    private String singleImageUrl;
    private Long singleLibraryImageId;
    private String singleLibraryImageUrl;
    private Map<String, Long> perFoodTypeMap;
    private Map<String, String> perFoodTypeUrls;
    private Map<String, Long> perFoodTypeLibraryMap;
    private Map<String, String> perFoodTypeLibraryUrls;
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
    public String getSingleImageUrl() {
        return singleImageUrl;
    }
    public void setSingleImageUrl(String singleImageUrl) {
        this.singleImageUrl = singleImageUrl;
    }
    public Long getSingleLibraryImageId() {
        return singleLibraryImageId;
    }
    public void setSingleLibraryImageId(Long singleLibraryImageId) {
        this.singleLibraryImageId = singleLibraryImageId;
    }
    public String getSingleLibraryImageUrl() {
        return singleLibraryImageUrl;
    }
    public void setSingleLibraryImageUrl(String singleLibraryImageUrl) {
        this.singleLibraryImageUrl = singleLibraryImageUrl;
    }
    public Map<String, Long> getPerFoodTypeMap() {
        return perFoodTypeMap;
    }
    public void setPerFoodTypeMap(Map<String, Long> perFoodTypeMap) {
        this.perFoodTypeMap = perFoodTypeMap;
    }
    public Map<String, String> getPerFoodTypeUrls() {
        return perFoodTypeUrls;
    }
    public void setPerFoodTypeUrls(Map<String, String> perFoodTypeUrls) {
        this.perFoodTypeUrls = perFoodTypeUrls;
    }
    public Map<String, Long> getPerFoodTypeLibraryMap() {
        return perFoodTypeLibraryMap;
    }
    public void setPerFoodTypeLibraryMap(Map<String, Long> perFoodTypeLibraryMap) {
        this.perFoodTypeLibraryMap = perFoodTypeLibraryMap;
    }
    public Map<String, String> getPerFoodTypeLibraryUrls() {
        return perFoodTypeLibraryUrls;
    }
    public void setPerFoodTypeLibraryUrls(Map<String, String> perFoodTypeLibraryUrls) {
        this.perFoodTypeLibraryUrls = perFoodTypeLibraryUrls;
    }
}
