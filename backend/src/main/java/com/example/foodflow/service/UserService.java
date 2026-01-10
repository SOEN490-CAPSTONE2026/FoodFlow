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

        if (request.getProfilePhoto() != null && !request.getProfilePhoto().trim().isEmpty()) {
            // Validate and normalize the base64 data URI
            String validatedDataUri = imageService.validateAndNormalizeDataUri(request.getProfilePhoto());
            user.setProfilePhoto(validatedDataUri);
        }

        Organization organization = user.getOrganization();
        if (organization != null) {
            // Handle name: prefer contactPerson field, fallback to name
            if (request.getContactPerson() != null && !request.getContactPerson().trim().isEmpty()) {
                organization.setContactPerson(request.getContactPerson());
            } else if (request.getName() != null && !request.getName().trim().isEmpty()) {
                organization.setContactPerson(request.getName());
            }
            
            if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
                organization.setPhone(request.getPhone());
            }
            if (request.getOrganizationName() != null && !request.getOrganizationName().trim().isEmpty()) {
                organization.setName(request.getOrganizationName());
            }
            if (request.getAddress() != null && !request.getAddress().trim().isEmpty()) {
                organization.setAddress(request.getAddress());
            }
            organizationRepository.save(organization);
        } else {
            // Check if user is trying to update organization-related fields
            boolean hasOrgFields = (request.getName() != null && !request.getName().trim().isEmpty()) ||
                    (request.getContactPerson() != null && !request.getContactPerson().trim().isEmpty()) ||
                    (request.getPhone() != null && !request.getPhone().trim().isEmpty()) ||
                    (request.getOrganizationName() != null && !request.getOrganizationName().trim().isEmpty()) ||
                    (request.getAddress() != null && !request.getAddress().trim().isEmpty());
            
            if (hasOrgFields) {
                logger.warn("User {} attempted to update organization fields but has no organization", userId);
                throw new RuntimeException("Cannot update organization fields: User does not have an organization");
            }
            // If only email or profile photo are being updated, allow it
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

