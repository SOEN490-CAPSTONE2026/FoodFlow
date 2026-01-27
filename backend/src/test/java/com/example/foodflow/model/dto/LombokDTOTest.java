package com.example.foodflow.model.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for DTOs with Lombok - testing equals, hashCode, toString
 */
class LombokDTOTest {
    
    @Test
    void userDTO_EqualsAndHashCode_ShouldWork() {
        UserDTO dto1 = new UserDTO();
        dto1.setId(1L);
        dto1.setEmail("test@test.com");
        
        UserDTO dto2 = new UserDTO();
        dto2.setId(1L);
        dto2.setEmail("test@test.com");
        
        assertEquals(dto1, dto2);
        assertEquals(dto1.hashCode(), dto2.hashCode());
        assertNotNull(dto1.toString());
    }
    
    @Test
    void organizationDTO_EqualsAndHashCode_ShouldWork() {
        OrganizationDTO dto1 = new OrganizationDTO();
        dto1.setId(1L);
        dto1.setName("Test");
        
        OrganizationDTO dto2 = new OrganizationDTO();
        dto2.setId(1L);
        dto2.setName("Test");
        
        assertEquals(dto1, dto2);
        assertEquals(dto1.hashCode(), dto2.hashCode());
        assertNotNull(dto1.toString());
    }
    
    @Test
    void receiverPreferencesRequest_ShouldWork() {
        ReceiverPreferencesRequest req = new ReceiverPreferencesRequest();
        assertNotNull(req);
        assertNotNull(req.toString());
    }
    
    @Test
    void receiverPreferencesResponse_ShouldWork() {
        ReceiverPreferencesResponse res = new ReceiverPreferencesResponse();
        res.setId(1L);
        res.setUserId(100L);
        
        assertEquals(1L, res.getId());
        assertEquals(100L, res.getUserId());
        assertNotNull(res.toString());
    }
    
    @Test
    void feedbackRequestDTO_ShouldWork() {
        FeedbackRequestDTO dto = new FeedbackRequestDTO();
        assertNotNull(dto);
        assertNotNull(dto.toString());
    }
    
    @Test
    void feedbackResponseDTO_ShouldWork() {
        FeedbackResponseDTO dto = new FeedbackResponseDTO();
        assertNotNull(dto);
        assertNotNull(dto.toString());
    }
    
    @Test
    void gamificationStatsResponse_ShouldWork() {
        GamificationStatsResponse res = new GamificationStatsResponse();
        assertNotNull(res);
        assertNotNull(res.toString());
    }
    
    @Test
    void achievementResponse_ShouldWork() {
        AchievementResponse res = new AchievementResponse();
        assertNotNull(res);
        assertNotNull(res.toString());
    }
    
    @Test
    void achievementProgress_ShouldWork() {
        AchievementProgress prog = new AchievementProgress();
        assertNotNull(prog);
        assertNotNull(prog.toString());
    }
    
    @Test
    void createReportRequest_ShouldWork() {
        CreateReportRequest req = new CreateReportRequest();
        assertNotNull(req);
        assertNotNull(req.toString());
    }
    
    @Test
    void disputeResponse_ShouldWork() {
        DisputeResponse res = new DisputeResponse();
        assertNotNull(res);
        assertNotNull(res.toString());
    }
    
    @Test
    void approvalResponse_ShouldWork() {
        ApprovalResponse res = new ApprovalResponse();
        assertNotNull(res);
        assertNotNull(res.toString());
    }
    
    @Test
    void surplusResponse_ShouldWork() {
        SurplusResponse res = new SurplusResponse();
        res.setId(1L);
        
        assertEquals(1L, res.getId());
        assertNotNull(res.toString());
    }
    
    @Test
    void createSurplusRequest_ShouldWork() {
        CreateSurplusRequest req = new CreateSurplusRequest();
        assertNotNull(req);
        assertNotNull(req.toString());
    }
    
    @Test
    void surplusFilterRequest_ShouldWork() {
        SurplusFilterRequest req = new SurplusFilterRequest();
        req.setStatus("AVAILABLE");
        
        assertEquals("AVAILABLE", req.getStatus());
        assertNotNull(req.toString());
    }
    
    @Test
    void surplusPostDTO_EqualsAndHashCode_ShouldWork() {
        SurplusPostDTO dto1 = new SurplusPostDTO();
        dto1.setId(1L);
        
        SurplusPostDTO dto2 = new SurplusPostDTO();
        dto2.setId(1L);
        
        assertEquals(dto1, dto2);
        assertNotNull(dto1.toString());
    }
    
    @Test
    void pickupSlotRequest_ShouldWork() {
        PickupSlotRequest req = new PickupSlotRequest();
        assertNotNull(req);
        assertNotNull(req.toString());
    }
    
    @Test
    void pickupSlotResponse_ShouldWork() {
        PickupSlotResponse res = new PickupSlotResponse();
        res.setId(1L);
        
        assertEquals(1L, res.getId());
        assertNotNull(res.toString());
    }
    
    @Test
    void confirmPickupRequest_ShouldWork() {
        ConfirmPickupRequest req = new ConfirmPickupRequest();
        assertNotNull(req);
        assertNotNull(req.toString());
    }
    
    @Test
    void rejectionRequest_ShouldWork() {
        RejectionRequest req = new RejectionRequest();
        req.setReason("Test");
        
        assertEquals("Test", req.getReason());
        assertNotNull(req.toString());
    }
    
    @Test
    void rejectionResponse_ShouldWork() {
        RejectionResponse res = new RejectionResponse();
        res.setSuccess(true);
        res.setMessage("Test");
        
        assertTrue(res.isSuccess());
        assertEquals("Test", res.getMessage());
        assertNotNull(res.toString());
    }
    
    @Test
    void adminUserResponse_NotNull() {
        AdminUserResponse response = new AdminUserResponse();
        assertNotNull(response);
        assertNotNull(response.toString());
    }
    
    @Test
    void adminDonationResponse_NotNull() {
        AdminDonationResponse response = new AdminDonationResponse();
        assertNotNull(response);
        assertNotNull(response.toString());
    }
    
    @Test
    void adminDisputeResponse_NotNull() {
        AdminDisputeResponse response = new AdminDisputeResponse();
        assertNotNull(response);
        assertNotNull(response.toString());
    }
}
