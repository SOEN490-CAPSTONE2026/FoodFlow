package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Referral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReferralRepository extends JpaRepository<Referral, Long> {

    List<Referral> findAllByOrderByCreatedAtDesc();
}
