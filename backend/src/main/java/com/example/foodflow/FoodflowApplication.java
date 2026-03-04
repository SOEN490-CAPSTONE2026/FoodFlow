package com.example.foodflow;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class FoodflowApplication {

	private static final Logger log = LoggerFactory.getLogger(FoodflowApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(FoodflowApplication.class, args);
		log.info("FoodFlow application started successfully");
	}

}
