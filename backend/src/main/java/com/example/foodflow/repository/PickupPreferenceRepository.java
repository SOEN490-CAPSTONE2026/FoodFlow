package com.example.foodflow.repository;

import com.example.foodflow.model.entity.PickupPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PickupPreferenceRepository extends JpaRepository<PickupPreference, Long> {
    Optional<PickupPreference> findByDonorId(Long donorId);
}
