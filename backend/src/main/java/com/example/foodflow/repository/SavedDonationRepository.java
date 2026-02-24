package com.example.foodflow.repository;

import com.example.foodflow.model.entity.SavedDonation;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavedDonationRepository extends JpaRepository<SavedDonation, Long> {

    boolean existsByReceiverAndSurplusPost(User receiver, SurplusPost surplusPost);

    boolean existsByReceiverIdAndSurplusPostId(Long receiverId, Long surplusPostId);

    void deleteByReceiverIdAndSurplusPostId(Long receiverId, Long surplusPostId);

    List<SavedDonation> findByReceiverIdOrderBySavedAtDesc(Long receiverId);

    long countByReceiverId(Long receiverId);

}
