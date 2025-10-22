package com.example.foodflow.repository;

import com.example.foodflow.model.entity.SurplusPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;
import com.example.foodflow.model.entity.User;



@Repository
public interface SurplusPostRepository extends JpaRepository<SurplusPost, Long>,  
                                               JpaSpecificationExecutor<SurplusPost> {
    
    List<SurplusPost> findByDonorId(Long donorId);
    
    List<SurplusPost> findByPickupLocation_Address(String address);
    List<SurplusPost> findByPickupLocation_LatitudeAndPickupLocation_Longitude(Double lat, Double lon);

    List<SurplusPost> findByClaimedFalse();
    List<SurplusPost> findByDonorOrderByCreatedAtDesc(User donor);

}
