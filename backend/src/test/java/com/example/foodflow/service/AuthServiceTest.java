package com.example.foodflow.service;

import com.example.foodflow.model.dto.AuthResponse;
import com.example.foodflow.model.dto.RegisterDonorRequest;
import com.example.foodflow.model.dto.RegisterReceiverRequest;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.repository.OrganizationRepository;
import com.example.foodflow.repository.UserRepository;
import com.example.foodflow.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private MetricsService metricsService;  // ADD THIS LINE

    @InjectMocks
    private AuthService authService;

    private RegisterDonorRequest donorRequest;
    private RegisterReceiverRequest receiverRequest;

    @BeforeEach
    void setUp() {
        donorRequest = new RegisterDonorRequest();
        donorRequest.setEmail("donor@test.com");
        donorRequest.setPassword("password123");
        donorRequest.setOrganizationName("Test Restaurant");
        donorRequest.setContactPerson("John Doe");
        donorRequest.setPhone("123-456-7890");
        donorRequest.setAddress("123 Main St");

        receiverRequest = new RegisterReceiverRequest();
        receiverRequest.setEmail("receiver@test.com");
        receiverRequest.setPassword("password123");
        receiverRequest.setOrganizationName("Test Charity");
        receiverRequest.setContactPerson("Jane Smith");
        receiverRequest.setPhone("987-654-3210");
        receiverRequest.setAddress("456 Oak Ave");
    }

    @Test
    void registerDonor_Success() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-password");
        when(jwtTokenProvider.generateToken(anyString(), anyString())).thenReturn("jwt-token");
        
        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setEmail("donor@test.com");
        savedUser.setRole(UserRole.DONOR);
        
        Organization savedOrg = new Organization();
        savedOrg.setId(1L);
        savedOrg.setName("Test Restaurant");
        
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(organizationRepository.save(any(Organization.class))).thenReturn(savedOrg);

        // When
        AuthResponse response = authService.registerDonor(donorRequest);

        // Then
        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals("donor@test.com", response.getEmail());
        
        verify(userRepository).existsByEmail("donor@test.com");
        verify(userRepository).save(any(User.class));
        verify(organizationRepository).save(any(Organization.class));
        verify(jwtTokenProvider).generateToken("donor@test.com", "DONOR");
    }

    @Test
    void registerReceiver_Success() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-password");
        when(jwtTokenProvider.generateToken(anyString(), anyString())).thenReturn("jwt-token");
        
        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setEmail("receiver@test.com");
        savedUser.setRole(UserRole.RECEIVER);
        
        Organization savedOrg = new Organization();
        savedOrg.setId(1L);
        savedOrg.setName("Test Charity");
        
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(organizationRepository.save(any(Organization.class))).thenReturn(savedOrg);

        // When
        AuthResponse response = authService.registerReceiver(receiverRequest);

        // Then
        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals("receiver@test.com", response.getEmail());
        
        verify(userRepository).existsByEmail("receiver@test.com");
        verify(userRepository).save(any(User.class));
        verify(organizationRepository).save(any(Organization.class));
        verify(jwtTokenProvider).generateToken("receiver@test.com", "RECEIVER");
    }

    @Test
    void registerDonor_EmailAlreadyExists_ThrowsException() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            authService.registerDonor(donorRequest);
        });
        
        verify(userRepository).existsByEmail("donor@test.com");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerReceiver_EmailAlreadyExists_ThrowsException() {
        // Given
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            authService.registerReceiver(receiverRequest);
        });
        
        verify(userRepository).existsByEmail("receiver@test.com");
        verify(userRepository, never()).save(any(User.class));
    }
}
