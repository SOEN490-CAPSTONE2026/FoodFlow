package com.example.foodflow.repository;

import com.example.foodflow.model.entity.ChangeStatus;
import com.example.foodflow.model.entity.ProfileChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface ProfileChangeRequestRepository
        extends JpaRepository<ProfileChangeRequest, Long> {

    List<ProfileChangeRequest> findByStatus(ChangeStatus status);

    List<ProfileChangeRequest> findByUserId(Long userId);

Optional<ProfileChangeRequest>
findByUser_IdAndEntityTypeAndFieldNameAndStatus(
        Long userId,
        String entityType,
        String fieldName,
        ChangeStatus status
);

}

