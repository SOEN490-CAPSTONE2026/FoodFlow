package com.example.foodflow.service;

import com.example.foodflow.model.dto.UserDTO;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void updateLanguagePreference(User user, String languagePreference) {
        user.setLanguagePreference(languagePreference);
        userRepository.save(user);
    }

    public UserDTO getProfile(User currentUser) {
        User u = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserDTO.toDTO(u);
    }
}
