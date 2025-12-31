package com.example.foodflow.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.foodflow.model.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    /**
     * Find all messages in a conversation, ordered by creation time (oldest first)
     */
    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt ASC")
    List<Message> findByConversationId(@Param("conversationId") Long conversationId);
    
    /**
     * Find unread messages for a specific user in a conversation
     */
    @Query("SELECT m FROM Message m " +
           "WHERE m.conversation.id = :conversationId " +
           "AND m.sender.id != :userId " +
           "AND m.readStatus = false " +
           "ORDER BY m.createdAt ASC")
    List<Message> findUnreadByConversationAndUser(@Param("conversationId") Long conversationId, 
                                                    @Param("userId") Long userId);
    
    /**
     * Count unread messages for a user across all conversations
     */
    @Query("SELECT COUNT(m) FROM Message m " +
           "JOIN m.conversation c " +
           "WHERE (c.user1.id = :userId OR c.user2.id = :userId) " +
           "AND m.sender.id != :userId " +
           "AND m.readStatus = false")
    long countUnreadByUser(@Param("userId") Long userId);
    
    /**
     * Count unread messages in a specific conversation for a user
     */
    @Query("SELECT COUNT(m) FROM Message m " +
           "WHERE m.conversation.id = :conversationId " +
           "AND m.sender.id != :userId " +
           "AND m.readStatus = false")
    long countUnreadInConversation(@Param("conversationId") Long conversationId, 
                                    @Param("userId") Long userId);

                                        /**
     * Find messages in a conversation with pagination (ordered by creation time)
     */
    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt ASC")
    Page<Message> findByConversationIdWithPagination(@Param("conversationId") Long conversationId, Pageable pageable);

}
