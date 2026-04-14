package com.example.foodflow.controller;

import com.example.foodflow.model.dto.AdminPendingChangeDTO;
import com.example.foodflow.model.dto.RejectionRequest;
import com.example.foodflow.model.dto.RejectionResponse;
import com.example.foodflow.service.ProfileChangeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminProfileChangeControllerTest {

    @Mock
    private ProfileChangeService profileChangeService;

    @InjectMocks
    private AdminProfileChangeController controller;

    @Test
    void approve_callsServiceAndReturnsOk() {
        ResponseEntity<Void> response = controller.approve(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(profileChangeService).approveProfileChange(1L);
    }

    @Test
    void reject_callsServiceAndReturnsSuccessResponse() {
        RejectionRequest request = new RejectionRequest("invalid_organization", "Custom message");

        ResponseEntity<RejectionResponse> response = controller.reject(2L, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Profile change rejected successfully", response.getBody().getMessage());
        verify(profileChangeService).rejectProfileChange(2L, "invalid_organization", "Custom message");
    }

    @Test
    void getPending_returnsListFromService() {
        AdminPendingChangeDTO dto = new AdminPendingChangeDTO();
        dto.setId(1L);
        dto.setUserName("Test User");
        dto.setFieldName("name");
        dto.setOldValue("Old");
        dto.setNewValue("New");

        when(profileChangeService.getPendingChanges()).thenReturn(List.of(dto));

        ResponseEntity<List<AdminPendingChangeDTO>> response = controller.getPending();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Test User", response.getBody().get(0).getUserName());
    }

    @Test
    void getPending_returnsEmptyListWhenNoPendingChanges() {
        when(profileChangeService.getPendingChanges()).thenReturn(List.of());

        ResponseEntity<List<AdminPendingChangeDTO>> response = controller.getPending();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isEmpty());
    }
}