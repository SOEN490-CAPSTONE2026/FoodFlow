package com.example.foodflow.repository;

import com.example.foodflow.model.entity.ChangeStatus;
import com.example.foodflow.model.entity.ProfileChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileChangeRequestRepository extends JpaRepository<ProfileChangeRequest, Long> {

    List<ProfileChangeRequest> findByStatus(ChangeStatus status);

    Optional<ProfileChangeRequest> findByUser_IdAndEntityTypeAndFieldNameAndStatus(
            Long userId,
            String entityType,
            String fieldName,
            ChangeStatus status
    );

    Optional<ProfileChangeRequest> findTopByUser_IdAndEntityTypeAndFieldNameAndStatusOrderByReviewedAtDesc(
        Long userId,
        String entityType,
        String fieldName,
        ChangeStatus status
);
}
