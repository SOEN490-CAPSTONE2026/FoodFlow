package com.example.foodflow.service;
import com.example.foodflow.model.dto.ReferralRequest;
import com.example.foodflow.model.dto.ReferralResponse;
import com.example.foodflow.model.entity.Referral;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.repository.ReferralRepository;
import com.example.foodflow.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;
@Service
@Transactional
public class ReferralService {
    private final ReferralRepository referralRepository;
    private final UserRepository userRepository;
    public ReferralService(ReferralRepository referralRepository, UserRepository userRepository) {
        this.referralRepository = referralRepository;
        this.userRepository = userRepository;
    }
    /**
     * Submit a new referral (community invite or business suggestion).
     *
     * @param request     Referral details
     * @param submitterId ID of the authenticated user submitting the referral
     * @return ReferralResponse containing the saved referral data
     */
    public ReferralResponse submitReferral(ReferralRequest request, Long submitterId) {
        User submitter = userRepository.findById(submitterId)
                .orElseThrow(() -> new RuntimeException("Submitter not found: " + submitterId));
        Referral referral = new Referral();
        referral.setSubmitter(submitter);
        referral.setReferralType(request.getReferralType());
        referral.setBusinessName(request.getBusinessName());
        referral.setContactEmail(request.getContactEmail());
        referral.setContactPhone(request.getContactPhone());
        referral.setMessage(request.getMessage());
        Referral saved = referralRepository.save(referral);
        return toResponse(saved);
    }
    /**
     * Get all referral submissions ordered by newest first (admin only).
     *
     * @return List of all referrals
     */
    @Transactional(readOnly = true)
    public List<ReferralResponse> getAllReferrals() {
        return referralRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    private ReferralResponse toResponse(Referral referral) {
        ReferralResponse response = new ReferralResponse();
        response.setId(referral.getId());
        response.setReferralType(referral.getReferralType());
        response.setBusinessName(referral.getBusinessName());
        response.setContactEmail(referral.getContactEmail());
        response.setContactPhone(referral.getContactPhone());
        response.setMessage(referral.getMessage());
        response.setSubmittedByEmail(referral.getSubmitter().getEmail());
        response.setCreatedAt(referral.getCreatedAt());
        return response;
    }
}
