package com.example.foodflow.repository;

import com.example.foodflow.model.entity.DonationTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationTimelineRepository extends JpaRepository<DonationTimeline, Long> {
    
    List<DonationTimeline> findBySurplusPostIdOrderByTimestampDesc(Long surplusPostId);
    
    List<DonationTimeline> findBySurplusPostIdAndVisibleToUsersOrderByTimestampDesc(Long surplusPostId, Boolean visibleToUsers);
}
