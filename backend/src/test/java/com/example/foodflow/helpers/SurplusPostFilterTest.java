// package com.example.foodflow.helpers;

import com.example.foodflow.helpers.BasicFilter;
import com.example.foodflow.model.entity.SurplusPost;
import com.example.foodflow.model.entity.User;
import com.example.foodflow.model.entity.UserRole;
import com.example.foodflow.repository.SurplusPostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.TestPropertySource;

// import java.time.LocalDateTime;

// import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
@TestPropertySource(properties = {
    "spring.jpa.properties.hibernate.validator.apply_to_ddl=false"
})
class SurplusPostSpecificationTest { /* 

    
    @Autowired
    private SurplusPostRepository repository;
    
//     @Autowired
//     private TestEntityManager entityManager;

//     private SurplusPost post1;
//     private SurplusPost post2;
//     private User donor1;
//     private User donor2;

//     @BeforeEach
//     void setup() {
//         // Create and persist donor users first
//         donor1 = new User();
//         donor1.setEmail("donor1@example.com");
//         donor1.setPassword("password123");  // Use 'password' instead of 'passwordHash'
//         donor1.setRole(UserRole.DONOR);  // Use the UserRole enum
//         donor1 = entityManager.persist(donor1);
        
//         donor2 = new User();
//         donor2.setEmail("donor2@example.com");
//         donor2.setPassword("password456");
//         donor2.setRole(UserRole.DONOR);
//         donor2 = entityManager.persist(donor2);
        
//         entityManager.flush();
        
//         // Create post1 with all required fields
//         post1 = new SurplusPost();
//         post1.setType("Fruit");
//         post1.setQuantity("5kg");
//         post1.setExpiryDate(LocalDateTime.now().plusDays(2));
//         post1.setPickupTime(LocalDateTime.now().plusHours(3));
//         post1.setLocation("Downtown Market");
//         post1.setDonor(donor1);
//         post1 = repository.save(post1);

//         // Create post2 with all required fields
//         post2 = new SurplusPost();
//         post2.setType("Vegetable");
//         post2.setQuantity("10kg");
//         post2.setExpiryDate(LocalDateTime.now().plusDays(3));
//         post2.setPickupTime(LocalDateTime.now().plusHours(5));
//         post2.setLocation("Farmer's Market");
//         post2.setDonor(donor2);
//         post2 = repository.save(post2);
//     }

//     @Test
//     void testFilterByIdSpecification() {
//         // Use the actual generated ID from post1
//         BasicFilter<Long> filter = BasicFilter.equal(post1.getId());

//         // Convert to Specification
//         Specification<SurplusPost> spec = filter.toSpecification("id");

//         // Query the DB
//         var results = repository.findAll(spec);

//         assertEquals(1, results.size());
//         assertEquals(post1.getId(), results.get(0).getId());
//     }

//     @Test
//     void testFilterByTypeSpecification() {
//         BasicFilter<String> filter = BasicFilter.equal("Vegetable");
//         Specification<SurplusPost> spec = filter.toSpecification("type");

//         var results = repository.findAll(spec);

//         assertEquals(1, results.size());
//         assertEquals(post2.getType(), results.get(0).getType());
//     }
    
//     @Test
//     void testFilterByIdGreaterThan() {
//         // Test greater than with the first post's ID
//         BasicFilter<Long> filter = BasicFilter.greaterThan(post1.getId());
//         Specification<SurplusPost> spec = filter.toSpecification("id");

//         var results = repository.findAll(spec);

//         assertEquals(1, results.size());
//         assertEquals(post2.getId(), results.get(0).getId());
//     }
    
//     @Test
//     void testFilterByIdLessThanOrEqual() {
//         // Test less than or equal with the first post's ID
//         BasicFilter<Long> filter = BasicFilter.lessThanOrEqual(post1.getId());
//         Specification<SurplusPost> spec = filter.toSpecification("id");

//         var results = repository.findAll(spec);

//         assertEquals(1, results.size());
//         assertEquals(post1.getId(), results.get(0).getId());
//     }
    
//     @Test
//     void testFilterByIdNotEqual() {
//         // Test not equal
//         BasicFilter<Long> filter = BasicFilter.notEqual(post1.getId());
//         Specification<SurplusPost> spec = filter.toSpecification("id");

//         var results = repository.findAll(spec);

//         assertEquals(1, results.size());
//         assertEquals(post2.getId(), results.get(0).getId());
//     }
    
//     @Test
//     void testFilterByLocationSpecification() {
//         BasicFilter<String> filter = BasicFilter.equal("Downtown Market");
//         Specification<SurplusPost> spec = filter.toSpecification("location");

//         var results = repository.findAll(spec);

        assertEquals(1, results.size());
        assertEquals(post1.getLocation(), results.get(0).getLocation());
    }
        */
}
