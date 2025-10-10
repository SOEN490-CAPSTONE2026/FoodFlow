package com.example.foodflow.repository;

import com.example.foodflow.model.entity.SurplusPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import com.example.foodflow.model.entity.User;



@Repository
public interface SurplusPostRepository extends JpaRepository<SurplusPost, Long> {
    
    List<SurplusPost> findByDonorId(Long donorId);
    
    List<SurplusPost> findByLocation(String location);

    List<SurplusPost> findByClaimedFalse();

    List<SurplusPost> findByDonorOrderByCreatedAtDesc(User donor);


}
