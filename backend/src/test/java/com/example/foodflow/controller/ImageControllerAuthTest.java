package com.example.foodflow.controller;
import com.example.foodflow.model.dto.DonorPhotoSettingsResponse;
import com.example.foodflow.model.dto.ImageUploadResponse;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.service.DonationImageService;
import com.example.foodflow.service.DonorPhotoPreferenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Collections;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ImageControllerAuthTest {
    @Autowired
    private MockMvc mockMvc;
    @MockBean
    private DonationImageService donationImageService;
    @MockBean
    private DonorPhotoPreferenceService donorPhotoPreferenceService;
    private UsernamePasswordAuthenticationToken donorAuth;
    private UsernamePasswordAuthenticationToken receiverAuth;
    @BeforeEach
    void setUp() {
        User donor = new User();
        donor.setId(1L);
        donor.setRole(UserRole.DONOR);
        User receiver = new User();
        receiver.setId(2L);
        receiver.setRole(UserRole.RECEIVER);
        donorAuth = new UsernamePasswordAuthenticationToken(
                donor,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("DONOR"))
        );
        receiverAuth = new UsernamePasswordAuthenticationToken(
                receiver,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("RECEIVER"))
        );
    }
    @Test
    void donorCanReadAndUploadPhotoSettings() throws Exception {
        when(donorPhotoPreferenceService.getSettings(any(User.class))).thenReturn(new DonorPhotoSettingsResponse());
        when(donationImageService.uploadDonationImage(any(User.class), any(), any(), any())).thenReturn(new ImageUploadResponse());
        mockMvc.perform(get("/api/donor/settings/photos")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(donorAuth)))
                .andExpect(status().isOk());
        MockMultipartFile file = new MockMultipartFile("file", "x.jpg", "image/jpeg", "img".getBytes());
        mockMvc.perform(multipart("/api/images/upload")
                        .file(file)
                        .with(SecurityMockMvcRequestPostProcessors.authentication(donorAuth)))
                .andExpect(status().isCreated());
    }
    @Test
    void receiverCannotAccessDonorPhotoEndpoints() throws Exception {
        mockMvc.perform(get("/api/donor/settings/photos")
                        .with(SecurityMockMvcRequestPostProcessors.authentication(receiverAuth)))
                .andExpect(status().isBadRequest());
        MockMultipartFile file = new MockMultipartFile("file", "x.jpg", "image/jpeg", "img".getBytes());
        mockMvc.perform(multipart("/api/images/upload")
                        .file(file)
                        .with(SecurityMockMvcRequestPostProcessors.authentication(receiverAuth)))
                .andExpect(status().isBadRequest());
    }
}
