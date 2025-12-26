package com.example.foodflow.repository;

import com.example.foodflow.model.entity.ReceiverPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.foodflow.model.entity.User;

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

    /**
     * Find receiver preferences by user
     */
    Optional<ReceiverPreferences> findByUser(User user);

    /**
     * Check if user has preferences set
     */
    boolean existsByUser(User user);
    
    /**
     * Delete preferences by user
     */
    void deleteByUser(User user);
    
}
