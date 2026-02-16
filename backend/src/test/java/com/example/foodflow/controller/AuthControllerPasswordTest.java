package com.example.foodflow.controller;

import com.example.foodflow.model.dto.ChangePasswordRequest;
import com.example.foodflow.model.dto.ForgotPasswordRequest;
import com.example.foodflow.model.dto.ResetPasswordRequest;
import com.example.foodflow.model.dto.VerifyResetCodeRequest;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.Collections;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerPasswordTest {

        @Autowired
        private MockMvc mockMvc;

        @MockBean
        private AuthService authService;

        @Autowired
        private ObjectMapper objectMapper;

        /**
         * Creates a RequestPostProcessor that sets the app's User entity as the
         * security principal, so @AuthenticationPrincipal resolves correctly.
         */
        private RequestPostProcessor authenticatedUser(User appUser) {
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                appUser,
                                null,
                                Collections.singletonList(
                                                new SimpleGrantedAuthority(appUser.getRole().name())));
                return authentication(authentication);
        }

        // ========== CHANGE PASSWORD TESTS ==========

        @Test
        void changePassword_Success() throws Exception {
                ChangePasswordRequest request = new ChangePasswordRequest();
                request.setCurrentPassword("OldTestSecure123!");
                request.setNewPassword("NewPassword456!");
                request.setConfirmPassword("NewPassword456!");

                User mockUser = new User();
                mockUser.setEmail("user@test.com");
                mockUser.setRole(UserRole.DONOR);

                when(authService.changePassword(any(User.class), eq("OldTestSecure123!"),
                                eq("NewPassword456!"), eq("NewPassword456!")))
                                .thenReturn(Map.of("message", "Password changed successfully"));

                mockMvc.perform(post("/api/auth/change-password")
                                .with(authenticatedUser(mockUser))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Password changed successfully"));
        }

        @Test
        void changePassword_IncorrectCurrentPassword_ReturnsBadRequest() throws Exception {
                ChangePasswordRequest request = new ChangePasswordRequest();
                request.setCurrentPassword("WrongTestSecure123!");
                request.setNewPassword("NewPassword456!");
                request.setConfirmPassword("NewPassword456!");

                User mockUser = new User();
                mockUser.setEmail("user@test.com");
                mockUser.setRole(UserRole.DONOR);

                when(authService.changePassword(any(User.class), eq("WrongTestSecure123!"),
                                eq("NewPassword456!"), eq("NewPassword456!")))
                                .thenThrow(new RuntimeException("Current password is incorrect"));

                mockMvc.perform(post("/api/auth/change-password")
                                .with(authenticatedUser(mockUser))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("Current password is incorrect"));
        }

        @Test
        void changePassword_PasswordMismatch_ReturnsBadRequest() throws Exception {
                ChangePasswordRequest request = new ChangePasswordRequest();
                request.setCurrentPassword("OldTestSecure123!");
                request.setNewPassword("NewPassword456!");
                request.setConfirmPassword("DifferentPassword789!");

                User mockUser = new User();
                mockUser.setEmail("user@test.com");
                mockUser.setRole(UserRole.DONOR);

                when(authService.changePassword(any(User.class), anyString(), anyString(), anyString()))
                                .thenThrow(new RuntimeException("Passwords do not match"));

                mockMvc.perform(post("/api/auth/change-password")
                                .with(authenticatedUser(mockUser))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("Passwords do not match"));
        }

        @Test
        void changePassword_WeakPassword_ReturnsBadRequest() throws Exception {
                ChangePasswordRequest request = new ChangePasswordRequest();
                request.setCurrentPassword("OldTestSecure123!");
                request.setNewPassword("weak");
                request.setConfirmPassword("weak");

                User mockUser = new User();
                mockUser.setEmail("user@test.com");
                mockUser.setRole(UserRole.DONOR);

                when(authService.changePassword(any(User.class), anyString(), eq("weak"), eq("weak")))
                                .thenThrow(new RuntimeException("Password must be at least 10 characters long"));

                mockMvc.perform(post("/api/auth/change-password")
                                .with(authenticatedUser(mockUser))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").exists());
        }

        @Test
        void changePassword_PasswordInHistory_ReturnsBadRequest() throws Exception {
                ChangePasswordRequest request = new ChangePasswordRequest();
                request.setCurrentPassword("OldTestSecure123!");
                request.setNewPassword("ReusedPassword456!");
                request.setConfirmPassword("ReusedPassword456!");

                User mockUser = new User();
                mockUser.setEmail("user@test.com");
                mockUser.setRole(UserRole.DONOR);

                when(authService.changePassword(any(User.class), anyString(), anyString(), anyString()))
                                .thenThrow(new RuntimeException("You cannot reuse a recent password"));

                mockMvc.perform(post("/api/auth/change-password")
                                .with(authenticatedUser(mockUser))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("You cannot reuse a recent password"));
        }

        // ========== FORGOT PASSWORD TESTS ==========

        @Test
        void forgotPassword_EmailMethod_Success() throws Exception {
                ForgotPasswordRequest request = new ForgotPasswordRequest();
                request.setEmail("user@test.com");
                request.setMethod("email");

                when(authService.forgotPassword(any(ForgotPasswordRequest.class)))
                                .thenReturn(Map.of("message", "Reset code sent to email"));

                mockMvc.perform(post("/api/auth/forgot-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Reset code sent to email"));
        }

        @Test
        void forgotPassword_SmsMethod_Success() throws Exception {
                ForgotPasswordRequest request = new ForgotPasswordRequest();
                request.setPhone("+11234567890");
                request.setMethod("sms");

                when(authService.forgotPassword(any(ForgotPasswordRequest.class)))
                                .thenReturn(Map.of("message", "Phone verified successfully"));

                mockMvc.perform(post("/api/auth/forgot-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Phone verified successfully"));
        }

        @Test
        void forgotPassword_UserNotFound_ReturnsBadRequest() throws Exception {
                ForgotPasswordRequest request = new ForgotPasswordRequest();
                request.setEmail("nonexistent@test.com");
                request.setMethod("email");

                when(authService.forgotPassword(any(ForgotPasswordRequest.class)))
                                .thenThrow(new RuntimeException("User not found"));

                mockMvc.perform(post("/api/auth/forgot-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("User not found"));
        }

        // ========== VERIFY RESET CODE TESTS ==========

        @Test
        void verifyResetCode_ValidCode_Success() throws Exception {
                VerifyResetCodeRequest request = new VerifyResetCodeRequest();
                request.setEmail("user@test.com");
                request.setCode("123456");

                when(authService.verifyResetCode("user@test.com", "123456"))
                                .thenReturn(true);

                mockMvc.perform(post("/api/auth/verify-reset-code")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Code verified successfully"))
                                .andExpect(jsonPath("$.email").value("user@test.com"));
        }

        @Test
        void verifyResetCode_InvalidCode_ReturnsBadRequest() throws Exception {
                VerifyResetCodeRequest request = new VerifyResetCodeRequest();
                request.setEmail("user@test.com");
                request.setCode("999999");

                when(authService.verifyResetCode("user@test.com", "999999"))
                                .thenReturn(false);

                mockMvc.perform(post("/api/auth/verify-reset-code")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("Invalid code"));
        }

        @Test
        void verifyResetCode_ExpiredCode_ReturnsBadRequest() throws Exception {
                VerifyResetCodeRequest request = new VerifyResetCodeRequest();
                request.setEmail("user@test.com");
                request.setCode("123456");

                when(authService.verifyResetCode("user@test.com", "123456"))
                                .thenThrow(new RuntimeException("Reset code has expired"));

                mockMvc.perform(post("/api/auth/verify-reset-code")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("Reset code has expired"));
        }

        // ========== RESET PASSWORD TESTS ==========

        @Test
        void resetPassword_WithEmail_Success() throws Exception {
                ResetPasswordRequest request = new ResetPasswordRequest();
                request.setEmail("user@test.com");
                request.setCode("123456");
                request.setNewPassword("NewSecureTestSecure123!");

                when(authService.resetPassword("user@test.com", null, "123456", "NewSecureTestSecure123!"))
                                .thenReturn(Map.of("message", "Password reset successfully"));

                mockMvc.perform(post("/api/auth/reset-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Password reset successfully"));
        }

        @Test
        void resetPassword_WithPhone_Success() throws Exception {
                ResetPasswordRequest request = new ResetPasswordRequest();
                request.setPhone("+11234567890");
                request.setCode("123456");
                request.setNewPassword("NewSecureTestSecure123!");

                when(authService.resetPassword(null, "+11234567890", "123456", "NewSecureTestSecure123!"))
                                .thenReturn(Map.of("message", "Password reset successfully"));

                mockMvc.perform(post("/api/auth/reset-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.message").value("Password reset successfully"));
        }

        @Test
        void resetPassword_InvalidCode_ReturnsBadRequest() throws Exception {
                ResetPasswordRequest request = new ResetPasswordRequest();
                request.setEmail("user@test.com");
                request.setCode("999999");
                request.setNewPassword("NewSecureTestSecure123!");

                when(authService.resetPassword(anyString(), any(), anyString(), anyString()))
                                .thenThrow(new RuntimeException("Invalid or expired reset code"));

                mockMvc.perform(post("/api/auth/reset-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("Invalid or expired reset code"));
        }

        @Test
        void resetPassword_WeakPassword_ReturnsBadRequest() throws Exception {
                ResetPasswordRequest request = new ResetPasswordRequest();
                request.setEmail("user@test.com");
                request.setCode("123456");
                request.setNewPassword("weak");

                when(authService.resetPassword(anyString(), any(), anyString(), eq("weak")))
                                .thenThrow(new RuntimeException("Password must be at least 10 characters long"));

                mockMvc.perform(post("/api/auth/reset-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").exists());
        }

        @Test
        void resetPassword_PasswordInHistory_ReturnsBadRequest() throws Exception {
                ResetPasswordRequest request = new ResetPasswordRequest();
                request.setEmail("user@test.com");
                request.setCode("123456");
                request.setNewPassword("ReusedTestSecure123!");

                when(authService.resetPassword(anyString(), any(), anyString(), anyString()))
                                .thenThrow(new RuntimeException("You cannot reuse a recent password"));

                mockMvc.perform(post("/api/auth/reset-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isBadRequest())
                                .andExpect(jsonPath("$.message").value("You cannot reuse a recent password"));
        }
}
