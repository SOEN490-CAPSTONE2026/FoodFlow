package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    
    /**
     * Find all conversations where the user is either user1 or user2
     * Ordered by last message time (most recent first)
     */
    @Query("SELECT c FROM Conversation c " +
           "WHERE c.user1.id = :userId OR c.user2.id = :userId " +
           "ORDER BY c.lastMessageAt DESC NULLS LAST, c.createdAt DESC")
    List<Conversation> findByUserId(@Param("userId") Long userId);
    
    /**
     * Find conversation between two users (order-independent)
     */
    @Query("SELECT c FROM Conversation c " +
           "WHERE (c.user1.id = :userId1 AND c.user2.id = :userId2) " +
           "OR (c.user1.id = :userId2 AND c.user2.id = :userId1)")
    Optional<Conversation> findByUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    
    /**
     * Check if conversation exists between two users
     */
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Conversation c " +
           "WHERE (c.user1.id = :userId1 AND c.user2.id = :userId2) " +
           "OR (c.user1.id = :userId2 AND c.user2.id = :userId1)")
    boolean existsBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
