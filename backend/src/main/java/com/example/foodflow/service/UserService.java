package com.example.foodflow.service;

import com.example.foodflow.model.dto.UpdateUserRequest;
import com.example.foodflow.model.dto.UserDTO;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.OrganizationRepository;
import com.example.foodflow.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private ImageService imageService;

    @Transactional
    public UserDTO updateUser(Long userId, UpdateUserRequest request) {
        logger.info("Updating user with ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getProfilePhoto() != null) {
            user.setProfilePhoto(request.getProfilePhoto());
        }

        Organization organization = user.getOrganization();
        if (organization != null) {
            if (request.getName() != null) {
                organization.setContactPerson(request.getName());
            }
            if (request.getContactPerson() != null) {
                organization.setContactPerson(request.getContactPerson());
            }
            if (request.getPhone() != null) {
                organization.setPhone(request.getPhone());
            }
            if (request.getOrganizationName() != null) {
                organization.setName(request.getOrganizationName());
            }
            if (request.getAddress() != null) {
                organization.setAddress(request.getAddress());
            }
            organizationRepository.save(organization);
        }

        User updatedUser = userRepository.save(user);
        logger.info("User updated successfully: {}", userId);

        return UserDTO.toDTO(updatedUser);
    }

    public UserDTO getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return UserDTO.toDTO(user);
    }

    @Transactional
    public UserDTO uploadProfilePhoto(Long userId, MultipartFile file) {
        logger.info("Uploading profile photo for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String base64Image = imageService.processImageFile(file);
        user.setProfilePhoto(base64Image);

        User updatedUser = userRepository.save(user);
        logger.info("Profile photo uploaded successfully for user: {}", userId);

        return UserDTO.toDTO(updatedUser);
    }
}

