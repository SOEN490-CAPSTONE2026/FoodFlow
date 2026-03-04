package com.example.foodflow.repository;

import com.example.foodflow.model.entity.InternalImageLibrary;
import com.example.foodflow.model.types.FoodType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InternalImageLibraryRepository extends JpaRepository<InternalImageLibrary, Long> {
    List<InternalImageLibrary> findByActiveTrueOrderByCreatedAtDesc();
    List<InternalImageLibrary> findAllByOrderByCreatedAtDesc();
    List<InternalImageLibrary> findByFoodTypeAndActiveTrueOrderByCreatedAtDesc(FoodType foodType);
    Optional<InternalImageLibrary> findFirstByFoodTypeAndActiveTrueOrderByCreatedAtDesc(FoodType foodType);
    Optional<InternalImageLibrary> findFirstByFoodTypeIsNullAndActiveTrueOrderByCreatedAtDesc();
}
