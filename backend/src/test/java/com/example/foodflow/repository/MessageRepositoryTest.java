package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.Message;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@TestPropertySource(locations = "classpath:application-test.properties")
class MessageRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private MessageRepository messageRepository;

    private User sender;
    private User receiver;
    private Conversation conversation;

    @BeforeEach
    void setUp() {
        sender = new User();
        sender.setEmail("sender@test.com");
        sender.setPassword("password1");
        sender.setRole(UserRole.DONOR);
        sender = entityManager.persistAndFlush(sender);

        receiver = new User();
        receiver.setEmail("receiver@test.com");
        receiver.setPassword("password2");
        receiver.setRole(UserRole.RECEIVER);
        receiver = entityManager.persistAndFlush(receiver);

        conversation = new Conversation();
        conversation.setUser1(sender);
        conversation.setUser2(receiver);
        conversation = entityManager.persistAndFlush(conversation);
    }

    @Test
    void testFindByConversationIdOrderByCreatedAtAsc_ReturnsMessagesInOrder() {
        Message message1 = new Message();
        message1.setConversation(conversation);
        message1.setSender(sender);
        message1.setMessageBody("First message");
        entityManager.persistAndFlush(message1);

        Message message2 = new Message();
        message2.setConversation(conversation);
        message2.setSender(receiver);
        message2.setMessageBody("Second message");
        entityManager.persistAndFlush(message2);

        Message message3 = new Message();
        message3.setConversation(conversation);
        message3.setSender(sender);
        message3.setMessageBody("Third message");
        entityManager.persistAndFlush(message3);

        List<Message> messages = messageRepository.findByConversationId(conversation.getId());

        assertThat(messages).hasSize(3);
        assertThat(messages.get(0).getMessageBody()).isEqualTo("First message");
        assertThat(messages.get(1).getMessageBody()).isEqualTo("Second message");
        assertThat(messages.get(2).getMessageBody()).isEqualTo("Third message");
    }

    @Test
    void testFindByConversationId_EmptyList() {
        List<Message> messages = messageRepository.findByConversationId(conversation.getId());

        assertThat(messages).isEmpty();
    }

    @Test
    void testSaveMessage() {
        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setMessageBody("Test message");

        Message saved = messageRepository.save(message);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getConversation().getId()).isEqualTo(conversation.getId());
        assertThat(saved.getSender().getId()).isEqualTo(sender.getId());
        assertThat(saved.getMessageBody()).isEqualTo("Test message");
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getReadStatus()).isFalse();
    }

    @Test
    void testMarkAsRead() {
        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setMessageBody("Test message");
        message.setReadStatus(false);
        message = entityManager.persistAndFlush(message);

        message.setReadStatus(true);
        Message updated = messageRepository.save(message);

        assertThat(updated.getReadStatus()).isTrue();
    }

    @Test
    void testFindByConversationId_OnlyReturnsMessagesForConversation() {
        // Create another conversation
        User user3 = new User();
        user3.setEmail("user3@test.com");
        user3.setPassword("password3");
        user3.setRole(UserRole.DONOR);
        user3 = entityManager.persistAndFlush(user3);

        Conversation otherConversation = new Conversation();
        otherConversation.setUser1(sender);
        otherConversation.setUser2(user3);
        otherConversation = entityManager.persistAndFlush(otherConversation);

        // Add messages to first conversation
        Message message1 = new Message();
        message1.setConversation(conversation);
        message1.setSender(sender);
        message1.setMessageBody("Message in conversation 1");
        entityManager.persistAndFlush(message1);

        // Add message to other conversation
        Message message2 = new Message();
        message2.setConversation(otherConversation);
        message2.setSender(sender);
        message2.setMessageBody("Message in conversation 2");
        entityManager.persistAndFlush(message2);

        List<Message> messages = messageRepository.findByConversationId(conversation.getId());

        assertThat(messages).hasSize(1);
        assertThat(messages.get(0).getMessageBody()).isEqualTo("Message in conversation 1");
    }

    @Test
    void testCountUnreadInConversation() {
        Message message1 = new Message();
        message1.setConversation(conversation);
        message1.setSender(sender);
        message1.setMessageBody("Message from sender");
        message1.setReadStatus(false);
        entityManager.persistAndFlush(message1);

        Message message2 = new Message();
        message2.setConversation(conversation);
        message2.setSender(sender);
        message2.setMessageBody("Another from sender");
        message2.setReadStatus(false);
        entityManager.persistAndFlush(message2);

        Message message3 = new Message();
        message3.setConversation(conversation);
        message3.setSender(receiver);
        message3.setMessageBody("Message from receiver");
        message3.setReadStatus(false);
        entityManager.persistAndFlush(message3);

        long unreadCount = messageRepository.countUnreadInConversation(conversation.getId(), receiver.getId());

        assertThat(unreadCount).isEqualTo(2); // receiver has 2 unread from sender
    }
}
