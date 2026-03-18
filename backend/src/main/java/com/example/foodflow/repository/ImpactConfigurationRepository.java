package com.example.foodflow.repository;

import com.example.foodflow.model.entity.ImpactConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for ImpactConfiguration entity
 */
@Repository
public interface ImpactConfigurationRepository extends JpaRepository<ImpactConfiguration, Long> {

    /**
     * Find the currently active configuration
     */
    Optional<ImpactConfiguration> findByIsActiveTrue();

    /**
     * Find configuration by version
     */
    Optional<ImpactConfiguration> findByVersion(String version);
}

