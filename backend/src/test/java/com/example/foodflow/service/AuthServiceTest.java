package com.example.foodflow.service;

import com.example.foodflow.model.dto.AuthResponse;
import com.example.foodflow.model.dto.LoginRequest;
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
        donorRequest.setConfirmPassword("password123");
        donorRequest.setOrganizationName("Test Restaurant");
        donorRequest.setContactPerson("John Doe");
        donorRequest.setPhone("123-456-7890");
        donorRequest.setAddress("123 Main St");

        receiverRequest = new RegisterReceiverRequest();
        receiverRequest.setEmail("receiver@test.com");
        receiverRequest.setPassword("password123");
        receiverRequest.setConfirmPassword("password123");
        receiverRequest.setOrganizationName("Test Charity");
        receiverRequest.setContactPerson("Jane Smith");
        receiverRequest.setPhone("987-654-3210");
        receiverRequest.setAddress("456 Oak Ave");
        receiverRequest.setCharityRegistrationNumber("CRN-12345");
    }

    @Test
    void registerDonor_PasswordsDoNotMatch_ThrowsException() {
        // Given
        donorRequest.setConfirmPassword("different");

        // When & Then
        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.registerDonor(donorRequest));
        assertEquals("Passwords do not match", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerReceiver_PasswordsDoNotMatch_ThrowsException() {
        // Given
        receiverRequest.setConfirmPassword("different");

        // When & Then
        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.registerReceiver(receiverRequest));
        assertEquals("Passwords do not match", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
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
        // Capture organization passed to save to assert fields set correctly
        when(organizationRepository.save(any(Organization.class))).thenAnswer(invocation -> {
            Organization orgArg = invocation.getArgument(0);
            // Simulate DB assigning id
            orgArg.setId(1L);
            return orgArg;
        });

        // When
        AuthResponse response = authService.registerReceiver(receiverRequest);

        // Then
        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals("receiver@test.com", response.getEmail());
        // verificationStatus should be included in response and set to PENDING
        assertEquals("PENDING", response.getVerificationStatus());
        
        verify(userRepository).existsByEmail("receiver@test.com");
        verify(userRepository).save(any(User.class));
        verify(organizationRepository).save(any(Organization.class));
        // Assert the organization saved had charity registration number and PENDING status
        verify(organizationRepository).save(argThat(org -> 
            "CRN-12345".equals(org.getCharityRegistrationNumber()) && org.getVerificationStatus() == VerificationStatus.PENDING
            && org.getOrganizationType() == com.example.foodflow.model.entity.OrganizationType.CHARITY
        ));
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

    // ====== LOGIN SERVICE TESTS ======

    @Test
    void login_ValidCredentials_Success() {
        // Given
        LoginRequest loginRequest = new LoginRequest("user@test.com", "password123");
        
        User user = new User();
        user.setId(1L);
        user.setEmail("user@test.com");
        user.setPassword("encoded-password");
        user.setRole(UserRole.DONOR);
        
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);
        when(jwtTokenProvider.generateToken("user@test.com", "DONOR")).thenReturn("jwt-token");

        // When
        AuthResponse response = authService.login(loginRequest);

        // Then
        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals("user@test.com", response.getEmail());
        assertEquals("DONOR", response.getRole());
        assertEquals("Account logged in successfully.", response.getMessage());
        
        verify(userRepository).findByEmail("user@test.com");
        verify(passwordEncoder).matches("password123", "encoded-password");
        verify(jwtTokenProvider).generateToken("user@test.com", "DONOR");
        verify(metricsService).incrementLoginSuccess();
    }

    @Test
    void login_UserNotFound_ThrowsException() {
        // Given
        LoginRequest loginRequest = new LoginRequest("nonexistent@test.com", "password123");
        when(userRepository.findByEmail("nonexistent@test.com")).thenReturn(Optional.empty());

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.login(loginRequest);
        });
        
        assertEquals("User not found", exception.getMessage());
        verify(userRepository).findByEmail("nonexistent@test.com");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(jwtTokenProvider, never()).generateToken(anyString(), anyString());
        verify(metricsService, never()).incrementLoginSuccess();
    }

    @Test
    void login_InvalidPassword_ThrowsException() {
        // Given
        LoginRequest loginRequest = new LoginRequest("user@test.com", "wrongpassword");
        
        User user = new User();
        user.setId(1L);
        user.setEmail("user@test.com");
        user.setPassword("encoded-password");
        user.setRole(UserRole.DONOR);
        
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "encoded-password")).thenReturn(false);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.login(loginRequest);
        });
        
        assertEquals("Invalid credentials", exception.getMessage());
        verify(userRepository).findByEmail("user@test.com");
        verify(passwordEncoder).matches("wrongpassword", "encoded-password");
        verify(jwtTokenProvider, never()).generateToken(anyString(), anyString());
        verify(metricsService, never()).incrementLoginSuccess();
    }

    @Test
    void login_DonorRole_GeneratesCorrectToken() {
        // Given
        LoginRequest loginRequest = new LoginRequest("donor@test.com", "password123");
        
        User donor = new User();
        donor.setId(1L);
        donor.setEmail("donor@test.com");
        donor.setPassword("encoded-password");
        donor.setRole(UserRole.DONOR);
        
        when(userRepository.findByEmail("donor@test.com")).thenReturn(Optional.of(donor));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);
        when(jwtTokenProvider.generateToken("donor@test.com", "DONOR")).thenReturn("donor-jwt-token");

        // When
        AuthResponse response = authService.login(loginRequest);

        // Then
        assertNotNull(response);
        assertEquals("donor-jwt-token", response.getToken());
        assertEquals("donor@test.com", response.getEmail());
        assertEquals("DONOR", response.getRole());
        
        verify(jwtTokenProvider).generateToken("donor@test.com", "DONOR");
        verify(metricsService).incrementLoginSuccess();
    }

    @Test
    void login_ReceiverRole_GeneratesCorrectToken() {
        // Given
        LoginRequest loginRequest = new LoginRequest("receiver@test.com", "password123");
        
        User receiver = new User();
        receiver.setId(1L);
        receiver.setEmail("receiver@test.com");
        receiver.setPassword("encoded-password");
        receiver.setRole(UserRole.RECEIVER);
        
        when(userRepository.findByEmail("receiver@test.com")).thenReturn(Optional.of(receiver));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);
        when(jwtTokenProvider.generateToken("receiver@test.com", "RECEIVER")).thenReturn("receiver-jwt-token");

        // When
        AuthResponse response = authService.login(loginRequest);

        // Then
        assertNotNull(response);
        assertEquals("receiver-jwt-token", response.getToken());
        assertEquals("receiver@test.com", response.getEmail());
        assertEquals("RECEIVER", response.getRole());
        
        verify(jwtTokenProvider).generateToken("receiver@test.com", "RECEIVER");
        verify(metricsService).incrementLoginSuccess();
    }

    @Test
    void changePassword_Success() {
        // Given
        User user = new User();
        user.setId(1L);
        user.setEmail("user@test.com");
        user.setPassword("encoded-old-password");
        
        when(passwordEncoder.matches("oldPassword123", "encoded-old-password")).thenReturn(true);
        when(passwordEncoder.matches("newPassword123", "encoded-old-password")).thenReturn(false);
        when(passwordEncoder.encode("newPassword123")).thenReturn("encoded-new-password");
        when(userRepository.save(any(User.class))).thenReturn(user);

        // When
        var response = authService.changePassword(user, "oldPassword123", "newPassword123", "newPassword123");

        // Then
        assertNotNull(response);
        assertEquals("Password changed successfully", response.get("message"));
        verify(passwordEncoder).encode("newPassword123");
        verify(userRepository).save(user);
        assertEquals("encoded-new-password", user.getPassword());
    }

    @Test
    void changePassword_IncorrectCurrentPassword_ThrowsException() {
        // Given
        User user = new User();
        user.setId(1L);
        user.setEmail("user@test.com");
        user.setPassword("encoded-old-password");
        
        when(passwordEncoder.matches("wrongPassword", "encoded-old-password")).thenReturn(false);

        // When & Then
        RuntimeException ex = assertThrows(RuntimeException.class, 
            () -> authService.changePassword(user, "wrongPassword", "newPassword123", "newPassword123"));
        
        assertEquals("Incorrect current password", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changePassword_NewPasswordSameAsCurrent_ThrowsException() {
        // Given
        User user = new User();
        user.setId(1L);
        user.setEmail("user@test.com");
        user.setPassword("encoded-password");
        
        when(passwordEncoder.matches("samePassword123", "encoded-password")).thenReturn(true);

        // When & Then
        RuntimeException ex = assertThrows(RuntimeException.class, 
            () -> authService.changePassword(user, "samePassword123", "samePassword123", "samePassword123"));
        
        assertEquals("New password must be different from current password", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void changePassword_PasswordsDoNotMatch_ThrowsException() {
        // Given
        User user = new User();
        user.setId(1L);
        user.setEmail("user@test.com");
        user.setPassword("encoded-old-password");
        
        when(passwordEncoder.matches("oldPassword123", "encoded-old-password")).thenReturn(true);

        // When & Then
        RuntimeException ex = assertThrows(RuntimeException.class, 
            () -> authService.changePassword(user, "oldPassword123", "newPassword123", "differentPassword123"));
        
        assertEquals("New password and confirmation do not match", ex.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void checkEmailExists_EmailExists_ReturnsTrue() {
        // Given
        String email = "existing@test.com";
        User user = new User();
        user.setEmail(email);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        // When
        boolean exists = authService.checkEmailExists(email);

        // Then
        assertTrue(exists);
        verify(userRepository).findByEmail(email);
    }

    @Test
    void checkEmailExists_EmailDoesNotExist_ReturnsFalse() {
        // Given
        String email = "nonexistent@test.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // When
        boolean exists = authService.checkEmailExists(email);

        // Then
        assertFalse(exists);
        verify(userRepository).findByEmail(email);
    }

    @Test
    void checkEmailExists_NullEmail_ReturnsFalse() {
        // When
        boolean exists = authService.checkEmailExists(null);

        // Then
        assertFalse(exists);
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void checkEmailExists_EmptyEmail_ReturnsFalse() {
        // When
        boolean exists = authService.checkEmailExists("   ");

        // Then
        assertFalse(exists);
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void checkPhoneExists_PhoneExists_ReturnsTrue() {
        // Given
        String phone = "+15145551234";
        User user = new User();
        Organization org = new Organization();
        org.setPhone(phone);
        user.setOrganization(org);
        when(userRepository.findByOrganizationPhone(phone)).thenReturn(Optional.of(user));

        // When
        boolean exists = authService.checkPhoneExists(phone);

        // Then
        assertTrue(exists);
        verify(userRepository).findByOrganizationPhone(phone);
    }

    @Test
    void checkPhoneExists_PhoneDoesNotExist_ReturnsFalse() {
        // Given
        String phone = "+15145551234";
        when(userRepository.findByOrganizationPhone(phone)).thenReturn(Optional.empty());

        // When
        boolean exists = authService.checkPhoneExists(phone);

        // Then
        assertFalse(exists);
        verify(userRepository).findByOrganizationPhone(phone);
    }

    @Test
    void checkPhoneExists_NullPhone_ReturnsFalse() {
        // When
        boolean exists = authService.checkPhoneExists(null);

        // Then
        assertFalse(exists);
        verify(userRepository, never()).findByOrganizationPhone(any());
    }

    @Test
    void checkPhoneExists_EmptyPhone_ReturnsFalse() {
        // When
        boolean exists = authService.checkPhoneExists("   ");

        // Then
        assertFalse(exists);
        verify(userRepository, never()).findByOrganizationPhone(any());
    }

    @Test
    void registerDonor_WithDataStorageConsent_SavesConsentFlag() {
        // Given
        donorRequest.setDataStorageConsent(true);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-password");
        when(jwtTokenProvider.generateToken(anyString(), anyString())).thenReturn("jwt-token");
        
        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setEmail("donor@test.com");
        savedUser.setRole(UserRole.DONOR);
        
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(organizationRepository.save(any(Organization.class))).thenReturn(new Organization());

        // When
        authService.registerDonor(donorRequest);

        // Then
        verify(userRepository).save(argThat(user -> 
            user.getDataStorageConsent() != null && user.getDataStorageConsent() == true
        ));
    }

    @Test
    void registerReceiver_WithDataStorageConsent_SavesConsentFlag() {
        // Given
        receiverRequest.setDataStorageConsent(true);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-password");
        when(jwtTokenProvider.generateToken(anyString(), anyString())).thenReturn("jwt-token");
        
        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setEmail("receiver@test.com");
        savedUser.setRole(UserRole.RECEIVER);
        
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(organizationRepository.save(any(Organization.class))).thenReturn(new Organization());

        // When
        authService.registerReceiver(receiverRequest);

        // Then
        verify(userRepository).save(argThat(user -> 
            user.getDataStorageConsent() != null && user.getDataStorageConsent() == true
        ));
    }

    @Test
    void registerDonor_WithoutDataStorageConsent_SavesFalseFlag() {
        // Given
        donorRequest.setDataStorageConsent(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-password");
        when(jwtTokenProvider.generateToken(anyString(), anyString())).thenReturn("jwt-token");
        
        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setEmail("donor@test.com");
        savedUser.setRole(UserRole.DONOR);
        
        Organization savedOrg = new Organization();
        savedOrg.setId(1L);
        
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(organizationRepository.save(any(Organization.class))).thenReturn(savedOrg);

        // When
        authService.registerDonor(donorRequest);

        // Then
        verify(userRepository).save(argThat(user -> 
            user.getDataStorageConsent() != null && user.getDataStorageConsent() == false
        ));
    }
}
