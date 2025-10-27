package com.example.foodflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FoodflowApplication {

	public static void main(String[] args) {
		SpringApplication.run(FoodflowApplication.class, args);
	}

}
