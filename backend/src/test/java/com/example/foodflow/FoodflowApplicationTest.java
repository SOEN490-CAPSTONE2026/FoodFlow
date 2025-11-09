package com.example.foodflow;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class FoodflowApplicationTest {

	@Autowired
	private ApplicationContext applicationContext;

	@Test
	void contextLoads() {
		// Verify Spring context loads successfully
		assertNotNull(applicationContext);
	}

	@Test
	void applicationHasSpringBootApplicationAnnotation() {
		// Verify the class has @SpringBootApplication annotation
		assertTrue(FoodflowApplication.class.isAnnotationPresent(
			org.springframework.boot.autoconfigure.SpringBootApplication.class
		));
	}

	@Test
	void applicationHasEnableSchedulingAnnotation() {
		// Verify the class has @EnableScheduling annotation
		assertTrue(FoodflowApplication.class.isAnnotationPresent(EnableScheduling.class));
	}

	@Test
	void applicationContextContainsFoodflowApplication() {
		// Verify FoodflowApplication bean exists in context
		assertNotNull(applicationContext);
		assertTrue(applicationContext.containsBeanDefinition("foodflowApplication"));
	}

	@Test
	void applicationCanAccessBeans() {
		// Verify we can access beans from context
		assertNotNull(applicationContext);
		String[] beanNames = applicationContext.getBeanDefinitionNames();
		assertTrue(beanNames.length > 0, "Application context should contain beans");
	}
}
