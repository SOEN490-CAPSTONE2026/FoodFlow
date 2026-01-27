package com.example.foodflow.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FileControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void serveEvidenceFile_ValidPath_ShouldAttemptToServe() throws Exception {
        // When & Then - File may not exist in test, but endpoint should be accessible
        mockMvc.perform(get("/api/files/evidence/donation-1/test.jpg"))
                .andExpect(status().isNotFound()); // 404 expected if file doesn't exist
    }
    
    @Test
    void serveEvidenceFile_WithDifferentExtensions_ShouldAttemptToServe() throws Exception {
        // Test various file extensions
        mockMvc.perform(get("/api/files/evidence/donation-2/image.png"))
                .andExpect(status().isNotFound());
                
        mockMvc.perform(get("/api/files/evidence/donation-3/document.pdf"))
                .andExpect(status().isNotFound());
    }
    
    @Test
    void serveLegacyUploadFile_ValidFilename_ShouldAttemptToServe() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/files/uploads/legacy-file.jpg"))
                .andExpect(status().isNotFound());
    }
    
    @Test
    void serveEvidenceFile_WithSpecialCharacters_ShouldHandle() throws Exception {
        // Test filenames with special characters - may return 400 for invalid encoding
        mockMvc.perform(get("/api/files/evidence/donation-1/file%20with%20spaces.jpg"))
                .andExpect(status().is4xxClientError());
    }
    
    @Test
    void serveEvidenceFile_LongDonationId_ShouldHandle() throws Exception {
        // Test with long donation ID
        mockMvc.perform(get("/api/files/evidence/donation-999999999/file.jpg"))
                .andExpect(status().isNotFound());
    }
    
    @Test
    void serveLegacyUploadFile_WithPathTraversal_ShouldNotAllow() throws Exception {
        // Test path traversal attempt (security) - may return 400 for invalid path
        mockMvc.perform(get("/api/files/uploads/../../../etc/passwd"))
                .andExpect(status().is4xxClientError());
    }
    
    @Test
    void serveEvidenceFile_MultipleExtensions_ShouldHandle() throws Exception {
        // Test files with multiple extensions
        mockMvc.perform(get("/api/files/evidence/donation-1/archive.tar.gz"))
                .andExpect(status().isNotFound());
    }
    
    @Test
    void serveEvidenceFile_NoExtension_ShouldHandle() throws Exception {
        // Test file without extension
        mockMvc.perform(get("/api/files/evidence/donation-1/README"))
                .andExpect(status().isNotFound());
    }
}
