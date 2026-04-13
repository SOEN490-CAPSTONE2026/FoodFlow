package com.example.foodflow.model.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
@Entity
@Table(name = "pickup_preferences")
public class PickupPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false, unique = true)
    private User donor;
    @Column(name = "availability_window_start")
    private LocalTime availabilityWindowStart;
    @Column(name = "availability_window_end")
    private LocalTime availabilityWindowEnd;
    @OneToMany(mappedBy = "preference", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("slotOrder ASC")
    private List<PickupPreferenceSlot> slots = new ArrayList<>();
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(ZoneOffset.UTC);
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }
    public PickupPreference() {}
    public PickupPreference(User donor) {
        this.donor = donor;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getDonor() { return donor; }
    public void setDonor(User donor) { this.donor = donor; }
    public LocalTime getAvailabilityWindowStart() { return availabilityWindowStart; }
    public void setAvailabilityWindowStart(LocalTime availabilityWindowStart) {
        this.availabilityWindowStart = availabilityWindowStart;
    }
    public LocalTime getAvailabilityWindowEnd() { return availabilityWindowEnd; }
    public void setAvailabilityWindowEnd(LocalTime availabilityWindowEnd) {
        this.availabilityWindowEnd = availabilityWindowEnd;
    }
    public List<PickupPreferenceSlot> getSlots() { return slots; }
    public void setSlots(List<PickupPreferenceSlot> slots) { this.slots = slots; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
