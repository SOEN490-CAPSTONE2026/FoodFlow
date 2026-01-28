package com.example.foodflow.model.dto;

import jakarta.validation.constraints.NotNull;

public class ClaimRequest {
    
    @NotNull(message = "{validation.surplusPostId.required}")
    private Long surplusPostId;
    
    // Optional: ID of an existing pickup slot
    private Long pickupSlotId;
    
    // Optional: inline pickup slot data when not using a stored slot
    private PickupSlotRequest pickupSlot;
    
    // Constructor
    public ClaimRequest() {}
    
    public ClaimRequest(Long surplusPostId) {
        this.surplusPostId = surplusPostId;
    }
    
    // Getters and Setters
    public Long getSurplusPostId() { return surplusPostId; }
    public void setSurplusPostId(Long surplusPostId) { this.surplusPostId = surplusPostId; }
    
    public Long getPickupSlotId() { return pickupSlotId; }
    public void setPickupSlotId(Long pickupSlotId) { this.pickupSlotId = pickupSlotId; }
    
    public PickupSlotRequest getPickupSlot() { return pickupSlot; }
    public void setPickupSlot(PickupSlotRequest pickupSlot) { this.pickupSlot = pickupSlot; }
}
