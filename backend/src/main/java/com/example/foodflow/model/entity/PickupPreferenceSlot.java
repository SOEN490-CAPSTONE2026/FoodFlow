package com.example.foodflow.model.entity;
import jakarta.persistence.*;
import java.time.LocalTime;
@Entity
@Table(name = "pickup_preference_slots")
public class PickupPreferenceSlot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preference_id", nullable = false)
    private PickupPreference preference;
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
    @Column(columnDefinition = "TEXT")
    private String notes;
    @Column(name = "slot_order", nullable = false)
    private Integer slotOrder;
    public PickupPreferenceSlot() {}
    public PickupPreferenceSlot(PickupPreference preference, LocalTime startTime,
                                LocalTime endTime, String notes, Integer slotOrder) {
        this.preference = preference;
        this.startTime = startTime;
        this.endTime = endTime;
        this.notes = notes;
        this.slotOrder = slotOrder;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PickupPreference getPreference() { return preference; }
    public void setPreference(PickupPreference preference) { this.preference = preference; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Integer getSlotOrder() { return slotOrder; }
    public void setSlotOrder(Integer slotOrder) { this.slotOrder = slotOrder; }
}
