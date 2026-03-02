package com.example.foodflow.repository;

import com.example.foodflow.model.entity.DonationImage;
import com.example.foodflow.model.types.DonationImageStatus;
import com.example.foodflow.model.types.FoodType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DonationImageRepository extends JpaRepository<DonationImage, Long> {
    List<DonationImage> findByDonorIdOrderByCreatedAtDesc(Long donorId);
    List<DonationImage> findByStatusOrderByCreatedAtDesc(DonationImageStatus status);
    List<DonationImage> findAllByOrderByCreatedAtDesc();
    Optional<DonationImage> findByIdAndDonorId(Long id, Long donorId);
    Optional<DonationImage> findFirstByDonorIdAndStatusOrderByCreatedAtDesc(Long donorId, DonationImageStatus status);
    Optional<DonationImage> findFirstByDonorIdAndFoodTypeAndStatusOrderByCreatedAtDesc(Long donorId, FoodType foodType, DonationImageStatus status);
}
