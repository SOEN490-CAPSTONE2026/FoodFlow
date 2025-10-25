package com.example.foodflow.repository;

import com.example.foodflow.model.entity.Conversation;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@TestPropertySource(locations = "classpath:application-test.properties")
class ConversationRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ConversationRepository conversationRepository;

    private User user1;
    private User user2;
    private User user3;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setEmail("user1@test.com");
        user1.setPassword("password1");
        user1.setRole(UserRole.DONOR);
        user1 = entityManager.persistAndFlush(user1);

        user2 = new User();
        user2.setEmail("user2@test.com");
        user2.setPassword("password2");
        user2.setRole(UserRole.RECEIVER);
        user2 = entityManager.persistAndFlush(user2);

        user3 = new User();
        user3.setEmail("user3@test.com");
        user3.setPassword("password3");
        user3.setRole(UserRole.DONOR);
        user3 = entityManager.persistAndFlush(user3);
    }

    @Test
    void testFindByUsers_Found() {
        Conversation conversation = new Conversation();
        conversation.setUser1(user1);
        conversation.setUser2(user2);
        entityManager.persistAndFlush(conversation);

        Optional<Conversation> found = conversationRepository.findByUsers(user1.getId(), user2.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getUser1().getId()).isEqualTo(user1.getId());
        assertThat(found.get().getUser2().getId()).isEqualTo(user2.getId());
    }

    @Test
    void testFindByUsers_NotFound() {
        Optional<Conversation> found = conversationRepository.findByUsers(user1.getId(), user2.getId());

        assertThat(found).isEmpty();
    }

    @Test
    void testFindByUserId_ReturnsConversationsForUser() {
        Conversation conv1 = new Conversation();
        conv1.setUser1(user1);
        conv1.setUser2(user2);
        entityManager.persistAndFlush(conv1);

        Conversation conv2 = new Conversation();
        conv2.setUser1(user3);
        conv2.setUser2(user1);
        entityManager.persistAndFlush(conv2);

        Conversation conv3 = new Conversation();
        conv3.setUser1(user2);
        conv3.setUser2(user3);
        entityManager.persistAndFlush(conv3);

        List<Conversation> conversations = conversationRepository.findByUserId(user1.getId());

        assertThat(conversations).hasSize(2);
        assertThat(conversations).extracting(c -> c.getId())
                .containsExactlyInAnyOrder(conv1.getId(), conv2.getId());
    }

    @Test
    void testFindByUserId_EmptyList() {
        List<Conversation> conversations = conversationRepository.findByUserId(user1.getId());

        assertThat(conversations).isEmpty();
    }

    @Test
    void testExistsBetweenUsers_True() {
        Conversation conversation = new Conversation();
        conversation.setUser1(user1);
        conversation.setUser2(user2);
        entityManager.persistAndFlush(conversation);

        boolean exists = conversationRepository.existsBetweenUsers(user1.getId(), user2.getId());

        assertThat(exists).isTrue();
    }

    @Test
    void testExistsBetweenUsers_False() {
        boolean exists = conversationRepository.existsBetweenUsers(user1.getId(), user2.getId());

        assertThat(exists).isFalse();
    }

    @Test
    void testSaveConversation() {
        Conversation conversation = new Conversation();
        conversation.setUser1(user1);
        conversation.setUser2(user2);

        Conversation saved = conversationRepository.save(conversation);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getUser1().getId()).isEqualTo(user1.getId());
        assertThat(saved.getUser2().getId()).isEqualTo(user2.getId());
        assertThat(saved.getCreatedAt()).isNotNull();
    }
}
