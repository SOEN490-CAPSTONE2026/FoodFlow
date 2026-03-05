package com.example.foodflow.repository;

import com.example.foodflow.model.entity.DonorPhotoPreferences;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DonorPhotoPreferencesRepository extends JpaRepository<DonorPhotoPreferences, Long> {
    Optional<DonorPhotoPreferences> findByDonorId(Long donorId);
}
