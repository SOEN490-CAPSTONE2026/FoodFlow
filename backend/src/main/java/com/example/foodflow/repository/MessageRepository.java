package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    // Get all messages for a specific surplus post
    List<Message> findBySurplusPostIdOrderByCreatedAtAsc(Long surplusPostId);
    
    // Get messages between two users for a specific post
    @Query("SELECT m FROM Message m WHERE m.surplusPost.id = :postId " +
           "AND ((m.sender.id = :userId1 AND m.receiver.id = :userId2) " +
           "OR (m.sender.id = :userId2 AND m.receiver.id = :userId1)) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findMessagesBetweenUsers(
        @Param("postId") Long postId,
        @Param("userId1") Long userId1,
        @Param("userId2") Long userId2
    );
    
    // Get unread messages for a user
    List<Message> findByReceiverIdAndReadStatusFalse(Long receiverId);
    
    // Count unread messages for a user
    long countByReceiverIdAndReadStatusFalse(Long receiverId);
}
