package com.example.foodflow.repository;

import com.example.foodflow.model.entity.ReceiverPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReceiverPreferencesRepository extends JpaRepository<ReceiverPreferences, Long> {
    
    /**
     * Find preferences by user ID
     */
    Optional<ReceiverPreferences> findByUserId(Long userId);
    
    /**
     * Check if preferences exist for a user
     */
    boolean existsByUserId(Long userId);
    
    /**
     * Delete preferences by user ID
     */
    void deleteByUserId(Long userId);
}
