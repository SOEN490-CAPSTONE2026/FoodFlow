package com.example.foodflow.service;

import com.example.foodflow.model.dto.ReceiverPreferencesRequest;
import com.example.foodflow.model.dto.ReceiverPreferencesResponse;
import com.example.foodflow.model.entity.ReceiverPreferences;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.ReceiverPreferencesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class ReceiverPreferencesService {
    
    @Autowired
    private ReceiverPreferencesRepository preferencesRepository;
    
    /**
     * Get preferences for a user
     */
    @Transactional(readOnly = true)
    public Optional<ReceiverPreferencesResponse> getPreferences(User user) {
        return preferencesRepository.findByUserId(user.getId())
                .map(ReceiverPreferencesResponse::new);
    }
    
    /**
     * Create or update preferences for a user
     */
    @Transactional
    public ReceiverPreferencesResponse savePreferences(User user, ReceiverPreferencesRequest request) {
        // Validate the request
        request.validate();
        
        // Check if preferences already exist
        ReceiverPreferences preferences = preferencesRepository.findByUserId(user.getId())
                .orElse(new ReceiverPreferences(user));
        
        // Update preferences
        preferences.setPreferredFoodTypes(request.getPreferredFoodTypes());
        preferences.setMaxCapacity(request.getMaxCapacity());
        preferences.setMinQuantity(request.getMinQuantity());
        preferences.setMaxQuantity(request.getMaxQuantity());
        preferences.setPreferredPickupWindows(request.getPreferredPickupWindows());
        preferences.setAcceptRefrigerated(request.getAcceptRefrigerated());
        preferences.setAcceptFrozen(request.getAcceptFrozen());
        preferences.setPreferredDonationSizes(request.getPreferredDonationSizes());
        
        // Update notification preferences if provided
        if (request.getNotificationPreferencesEnabled() != null) {
            preferences.setNotificationPreferencesEnabled(request.getNotificationPreferencesEnabled());
        }
        
        // Save to database
        ReceiverPreferences saved = preferencesRepository.save(preferences);
        
        return new ReceiverPreferencesResponse(saved);
    }
    
    /**
     * Delete preferences for a user
     */
    @Transactional
    public void deletePreferences(User user) {
        preferencesRepository.deleteByUserId(user.getId());
    }
    
    /**
     * Check if user has preferences set
     */
    @Transactional(readOnly = true)
    public boolean hasPreferences(User user) {
        return preferencesRepository.existsByUserId(user.getId());
    }
    
    /**
     * Get preferences or create default ones
     */
    @Transactional
    public ReceiverPreferencesResponse getOrCreateDefaultPreferences(User user) {
        Optional<ReceiverPreferences> existing = preferencesRepository.findByUserId(user.getId());
        
        if (existing.isPresent()) {
            return new ReceiverPreferencesResponse(existing.get());
        }
        
        // Create default preferences
        ReceiverPreferences defaultPrefs = new ReceiverPreferences(user);
        defaultPrefs.setMaxCapacity(50); // Default capacity
        defaultPrefs.setMinQuantity(0);
        defaultPrefs.setMaxQuantity(100);
        defaultPrefs.setAcceptRefrigerated(true);
        defaultPrefs.setAcceptFrozen(true);
        defaultPrefs.setNotificationPreferencesEnabled(true); // Default to enabled
        
        ReceiverPreferences saved = preferencesRepository.save(defaultPrefs);
        return new ReceiverPreferencesResponse(saved);
    }
}
