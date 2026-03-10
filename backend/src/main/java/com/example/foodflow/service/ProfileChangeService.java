package com.example.foodflow.service;

import com.example.foodflow.audit.AuditLogger;
import com.example.foodflow.model.entity.*;
import com.example.foodflow.repository.OrganizationRepository;
import com.example.foodflow.repository.ProfileChangeRequestRepository;
import com.example.foodflow.repository.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;



import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class ProfileChangeService {

    private final ProfileChangeRequestRepository repository;
    private final AuditLogger auditLogger;
    private final SensitiveFieldRegistry registry;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
private final NotificationService notificationService;


    public ProfileChangeService(ProfileChangeRequestRepository repository,
                                AuditLogger auditLogger,
                                SensitiveFieldRegistry registry, 
                                OrganizationRepository organizationRepository,
                            UserRepository userRepository,
                        NotificationService notificationService) {
        this.repository = repository;
        this.auditLogger = auditLogger;
        this.registry = registry;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
    this.notificationService = notificationService;

    }

    @Transactional
    public boolean handleOrganizationFieldUpdate(User user,
                                                 Organization organization,
                                                 String fieldName,
                                                 String newValue) {

        
        if (!registry.isSensitive("ORGANIZATION", fieldName)) {
            return false;
        }

        String oldValue = organization != null
        ? extractOldValue(organization, fieldName)
        : null;



        Optional<ProfileChangeRequest> existingPending =
                repository.findByUser_IdAndEntityTypeAndFieldNameAndStatus(
                        user.getId(),
                        "ORGANIZATION",
                        fieldName,
                        ChangeStatus.PENDING
                );

        
        if (existingPending.isPresent()) {

            ProfileChangeRequest request = existingPending.get();
            request.setNewValue(newValue);
            request.setSubmittedAt(LocalDateTime.now());

            repository.save(request);

            auditLogger.logAction(
                    new AuditLog(
                            user.getEmail(),
                            "UPDATE_PENDING_PROFILE_CHANGE",
                            "ORGANIZATION",
                            user.getId().toString(),
                            null,
                            oldValue,
                            newValue
                    )
            );

            return true;
        }


        ProfileChangeRequest request = new ProfileChangeRequest();
        request.setUser(user);
        request.setEntityType("ORGANIZATION");
        request.setFieldName(fieldName);
        request.setOldValue(oldValue);
        request.setNewValue(newValue);
        request.setStatus(ChangeStatus.PENDING);
        request.setSubmittedAt(LocalDateTime.now());

        repository.save(request);

        auditLogger.logAction(
                new AuditLog(
                        user.getEmail(),
                        "SUBMIT_PROFILE_CHANGE",
                        "ORGANIZATION",
                        user.getId().toString(),
                        null,
                        oldValue,
                        newValue
                )
        );

        return true;
    }

    private String extractOldValue(Organization org, String fieldName) {
        return switch (fieldName) {
            case "name" -> org.getName();
            case "businessLicense" -> org.getBusinessLicense();
            case "charityRegistrationNumber" -> org.getCharityRegistrationNumber();
            case "organizationType" -> org.getOrganizationType() != null
                    ? org.getOrganizationType().name()
                    : null;
            case "capacity" -> org.getCapacity() != null
                    ? org.getCapacity().toString()
                    : null;
            default -> null;
        };
    }

   @Transactional
public void approveProfileChange(Long requestId) {

    ProfileChangeRequest request = repository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));

    if (request.getStatus() != ChangeStatus.PENDING) {
        throw new IllegalStateException("Request is not pending");
    }

    User user = request.getUser();

    if ("ORGANIZATION".equals(request.getEntityType())) {

        Organization org = organizationRepository
                .findByUserId(user.getId())
                .orElseGet(() -> {
                    Organization o = new Organization();
                    o.setUser(user);
                    return o;
                });

        switch (request.getFieldName()) {
            case "name" -> org.setName(request.getNewValue());
            case "address" -> org.setAddress(request.getNewValue());
            case "phone" -> org.setPhone(request.getNewValue());
            case "contactPerson" -> org.setContactPerson(request.getNewValue());
        }

        organizationRepository.save(org);
        user.setOrganization(org);
    }

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    User admin = userRepository.findByEmail(auth.getName())
            .orElseThrow();

    request.setStatus(ChangeStatus.APPROVED);
    request.setReviewedAt(LocalDateTime.now());
    request.setReviewedBy(admin);

    repository.save(request);

auditLogger.logAction(
        new AuditLog(
                admin.getEmail(),                      
                "APPROVE_PROFILE_CHANGE",             
                request.getEntityType(),               
                request.getId().toString(),             
                null,                                  
                request.getOldValue(),                 
                request.getNewValue()                   
        )
);


    notificationService.sendProfileChangeNotification(
        user,
        "Your profile change has been approved."
);

}
@Transactional
public void rejectProfileChange(Long requestId, String reason, String customMessage) {

    ProfileChangeRequest request = repository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));

    if (request.getStatus() != ChangeStatus.PENDING) {
        throw new IllegalStateException("Request is not pending");
    }

    User user = request.getUser();

    Authentication auth = SecurityContextHolder
            .getContext()
            .getAuthentication();

    User admin = userRepository.findByEmail(auth.getName())
            .orElseThrow();

    request.setStatus(ChangeStatus.REJECTED);
    request.setReviewedAt(LocalDateTime.now());
    request.setReviewedBy(admin);
    request.setRejectionReason(reason);

    repository.save(request);

   auditLogger.logAction(
        new AuditLog(
                admin.getEmail(),
                "REJECT_PROFILE_CHANGE",
                request.getEntityType(),
                request.getId().toString(),
                null,
                request.getOldValue(),
                "Rejected: " + request.getNewValue() +
                " | Reason: " + reason
        )
);



    String notificationMessage = (customMessage != null && !customMessage.isBlank())
            ? customMessage
            : "Your profile change has been rejected. Reason: " + reason;

    notificationService.sendProfileChangeNotification(user, notificationMessage);
}




}
