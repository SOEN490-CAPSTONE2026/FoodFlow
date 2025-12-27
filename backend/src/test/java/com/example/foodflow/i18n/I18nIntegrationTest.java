package com.example.foodflow.i18n;

import com.example.foodflow.model.dto.LoginRequest;
import com.example.foodflow.model.dto.RegisterDonorRequest;
import com.example.foodflow.model.dto.CreateSurplusRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for internationalization (i18n) functionality.
 * Tests that Accept-Language header properly localizes error messages across all 6 supported languages.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class I18nIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_PASSWORD = "password123";

    @BeforeEach
    void setUp() {
        // Create a test user for login tests
        User user = new User();
        user.setEmail(TEST_EMAIL);
        user.setPassword(passwordEncoder.encode(TEST_PASSWORD));
        user.setRole(UserRole.DONOR);
        userRepository.save(user);
    }

    // ========== English (en) Tests ==========

    @Test
    @DisplayName("Validation errors should be in English when Accept-Language is 'en'")
    void testValidationErrors_English() throws Exception {
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("invalid-email"); // Invalid format
        request.setPassword("123"); // Too short

        mockMvc.perform(post("/api/auth/register/donor")
                .header("Accept-Language", "en")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Validation failed")))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'email')].message").value(containsString("Invalid email format")))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'password')].message").value(containsString("at least 8 characters")));
    }

    @Test
    @DisplayName("Business exception should be in English when Accept-Language is 'en'")
    void testBusinessException_English() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .header("Accept-Language", "en")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("User not found")));
    }

    @Test
    @DisplayName("Email already exists error should be in English")
    void testEmailExists_English() throws Exception {
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail(TEST_EMAIL); // Already exists
        request.setPassword("password123");
        request.setOrganizationName("Test Org");
        request.setContactPerson("John Doe");
        request.setPhone("1234567890");
        request.setAddress("123 Main St");

        mockMvc.perform(post("/api/auth/register/donor")
                .header("Accept-Language", "en")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Email already exists")));
    }

    // ========== French (fr) Tests ==========

    @Test
    @DisplayName("Validation errors should be in French when Accept-Language is 'fr'")
    void testValidationErrors_French() throws Exception {
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("invalid-email");
        request.setPassword("123");

        mockMvc.perform(post("/api/auth/register/donor")
                .header("Accept-Language", "fr")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("La validation a échoué")))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'email')].message").value(containsString("Format d'adresse e-mail invalide")))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'password')].message").value(containsString("au moins 8 caractères")));
    }

    @Test
    @DisplayName("Business exception should be in French when Accept-Language is 'fr'")
    void testBusinessException_French() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .header("Accept-Language", "fr")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Utilisateur introuvable")));
    }

    @Test
    @DisplayName("Email already exists error should be in French")
    void testEmailExists_French() throws Exception {
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail(TEST_EMAIL);
        request.setPassword("password123");
        request.setOrganizationName("Test Org");
        request.setContactPerson("John Doe");
        request.setPhone("1234567890");
        request.setAddress("123 Main St");

        mockMvc.perform(post("/api/auth/register/donor")
                .header("Accept-Language", "fr")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("L'adresse e-mail existe déjà")));
    }

    // ========== Spanish (es) Tests ==========

    @Test
    @DisplayName("Validation errors should be in Spanish when Accept-Language is 'es'")
    void testValidationErrors_Spanish() throws Exception {
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("invalid-email");
        request.setPassword("123");

        mockMvc.perform(post("/api/auth/register/donor")
                .header("Accept-Language", "es")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("La validación falló")))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'email')].message").value(containsString("Formato de correo electrónico inválido")))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'password')].message").value(containsString("al menos 8 caracteres")));
    }

    @Test
    @DisplayName("Business exception should be in Spanish when Accept-Language is 'es'")
    void testBusinessException_Spanish() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .header("Accept-Language", "es")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Usuario no encontrado")));
    }

    // ========== Mandarin Chinese (zh) Tests ==========

    @Test
    @DisplayName("Validation errors should be in Chinese when Accept-Language is 'zh'")
    void testValidationErrors_Chinese() throws Exception {
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("invalid-email");
        request.setPassword("123");

        mockMvc.perform(post("/api/auth/register/donor")
                .header("Accept-Language", "zh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("验证失败")))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'email')].message").value(containsString("无效的电子邮件格式")))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'password')].message").value(containsString("至少8个字符")));
    }

    @Test
    @DisplayName("Business exception should be in Chinese when Accept-Language is 'zh'")
    void testBusinessException_Chinese() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .header("Accept-Language", "zh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("未找到用户")));
    }

    // ========== Arabic (ar) Tests ==========

    @Test
    @DisplayName("Validation errors should be in Arabic when Accept-Language is 'ar'")
    void testValidationErrors_Arabic() throws Exception {
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("invalid-email");
        request.setPassword("123");

        mockMvc.perform(post("/api/auth/register/donor")
                .header("Accept-Language", "ar")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("فشل التحقق")))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'email')].message").value(containsString("تنسيق البريد الإلكتروني غير صحيح")))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'password')].message").value(containsString("8 أحرف على الأقل")));
    }

    @Test
    @DisplayName("Business exception should be in Arabic when Accept-Language is 'ar'")
    void testBusinessException_Arabic() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .header("Accept-Language", "ar")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("لم يتم العثور على المستخدم")));
    }

    // ========== Portuguese (pt) Tests ==========

    @Test
    @DisplayName("Validation errors should be in Portuguese when Accept-Language is 'pt'")
    void testValidationErrors_Portuguese() throws Exception {
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("invalid-email");
        request.setPassword("123");

        mockMvc.perform(post("/api/auth/register/donor")
                .header("Accept-Language", "pt")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("A validação falhou")))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'email')].message").value(containsString("Formato de e-mail inválido")))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'password')].message").value(containsString("pelo menos 8 caracteres")));
    }

    @Test
    @DisplayName("Business exception should be in Portuguese when Accept-Language is 'pt'")
    void testBusinessException_Portuguese() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .header("Accept-Language", "pt")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Usuário não encontrado")));
    }

    // ========== Fallback Tests ==========

    @Test
    @DisplayName("Should fallback to English when unsupported language is requested")
    void testUnsupportedLanguage_FallbackToEnglish() throws Exception {
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("invalid-email");
        request.setPassword("123");

        mockMvc.perform(post("/api/auth/register/donor")
                .header("Accept-Language", "de") // German not supported
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Validation failed")))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'email')].message").value(containsString("Invalid email format")));
    }

    @Test
    @DisplayName("Should use English when no Accept-Language header is provided")
    void testNoLanguageHeader_DefaultToEnglish() throws Exception {
        RegisterDonorRequest request = new RegisterDonorRequest();
        request.setEmail("invalid-email");
        request.setPassword("123");

        mockMvc.perform(post("/api/auth/register/donor")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Validation failed")));
    }

    // ========== Invalid Credentials Tests ==========

    @Test
    @DisplayName("Invalid credentials error should be in French")
    void testInvalidCredentials_French() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail(TEST_EMAIL);
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .header("Accept-Language", "fr")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Adresse e-mail ou mot de passe invalide")));
    }

    @Test
    @DisplayName("Invalid credentials error should be in Spanish")
    void testInvalidCredentials_Spanish() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail(TEST_EMAIL);
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .header("Accept-Language", "es")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Correo electrónico o contraseña inválidos")));
    }

    @Test
    @DisplayName("Invalid credentials error should be in Chinese")
    void testInvalidCredentials_Chinese() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail(TEST_EMAIL);
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .header("Accept-Language", "zh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("无效的电子邮件或密码")));
    }

    @Test
    @DisplayName("Invalid credentials error should be in Arabic")
    void testInvalidCredentials_Arabic() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail(TEST_EMAIL);
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .header("Accept-Language", "ar")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("البريد الإلكتروني أو كلمة المرور غير صحيحة")));
    }

    @Test
    @DisplayName("Invalid credentials error should be in Portuguese")
    void testInvalidCredentials_Portuguese() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail(TEST_EMAIL);
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .header("Accept-Language", "pt")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("E-mail ou senha inválidos")));
    }
}

