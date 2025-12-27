package com.example.foodflow.repository;

import com.example.foodflow.model.entity.AccountStatus;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByOrganizationPhone(String phone);
    List<User> findByRole(UserRole role);
    
    // Admin query methods with pagination
    Page<User> findByRole(UserRole role, Pageable pageable);
    Page<User> findByAccountStatus(AccountStatus accountStatus, Pageable pageable);
    Page<User> findByRoleAndAccountStatus(UserRole role, AccountStatus accountStatus, Pageable pageable);
    Page<User> findByEmailContainingIgnoreCase(String email, Pageable pageable);
    
    // Count methods for statistics
    long countByRole(UserRole role);
    long countByAccountStatus(AccountStatus accountStatus);
}
