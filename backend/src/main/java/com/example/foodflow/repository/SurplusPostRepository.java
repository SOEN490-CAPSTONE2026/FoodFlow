package com.example.foodflow.repository;

import com.example.foodflow.model.entity.SurplusPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface SurplusPostRepository extends JpaRepository<SurplusPost, Long>,  
                                               JpaSpecificationExecutor<SurplusPost> {
    
    List<SurplusPost> findByDonorId(Long donorId);
    
    List<SurplusPost> findByLocation(String location);
}
