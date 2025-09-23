package com.example.foodflow.service;

import com.example.foodflow.model.dto.AuthResponse;
import com.example.foodflow.model.dto.RegisterDonorRequest;
import com.example.foodflow.model.dto.RegisterReceiverRequest;
import com.example.foodflow.model.dto.LoginRequest;
import com.example.foodflow.model.entity.Organization;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.OrganizationRepository;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Transactional
    public AuthResponse registerDonor(RegisterDonorRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Create user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.DONOR);

        User savedUser = userRepository.save(user);

        // Create organization
        Organization organization = new Organization();
        organization.setUser(savedUser);
        organization.setName(request.getOrganizationName());
        organization.setContactPerson(request.getContactPerson());
        organization.setPhone(request.getPhone());
        organization.setAddress(request.getAddress());
        organization.setOrganizationType(request.getOrganizationType());
        organization.setBusinessLicense(request.getBusinessLicense());

        organizationRepository.save(organization);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getRole().toString());

        return new AuthResponse(token, savedUser.getEmail(), savedUser.getRole().toString(), "Donor registered successfully");
    }

    @Transactional
    public AuthResponse registerReceiver(RegisterReceiverRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Create user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.RECEIVER);

        User savedUser = userRepository.save(user);

        // Create organization
        Organization organization = new Organization();
        organization.setUser(savedUser);
        organization.setName(request.getOrganizationName());
        organization.setContactPerson(request.getContactPerson());
        organization.setPhone(request.getPhone());
        organization.setAddress(request.getAddress());
        organization.setOrganizationType(request.getOrganizationType());
        organization.setCapacity(request.getCapacity());

        organizationRepository.save(organization);

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(savedUser.getEmail(), savedUser.getRole().toString());

        return new AuthResponse(token, savedUser.getEmail(), savedUser.getRole().toString(), "Receiver registered successfully");
    }

    public AuthResponse login(LoginRequest request) {
    User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        throw new RuntimeException("Invalid credentials");
    }

    String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().toString());
    return new AuthResponse(token, user.getEmail(), user.getRole().toString(), "Account logged in successfully.");
}
}
