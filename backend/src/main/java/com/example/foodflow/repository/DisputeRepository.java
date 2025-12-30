package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Dispute;
import com.example.foodflow.model.types.DisputeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long>, JpaSpecificationExecutor<Dispute> {
    
    // Find disputes by reporter
    List<Dispute> findByReporterId(Long reporterId);
    
    // Find disputes by reported user
    List<Dispute> findByReportedId(Long reportedId);
    
    // Find disputes by status
    Page<Dispute> findByStatus(DisputeStatus status, Pageable pageable);
    
    // Find disputes by donation
    List<Dispute> findByDonationId(Long donationId);
}
