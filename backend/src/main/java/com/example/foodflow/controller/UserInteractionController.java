package com.example.foodflow.controller;

import com.example.foodflow.service.MetricsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "${spring.web.cors.allowed-origins}")
public class UserInteractionController {

    private final MetricsService metricsService;

    public UserInteractionController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @PostMapping("/track")
    public ResponseEntity<Void> trackUserInteraction(@RequestBody Map<String, String> interaction) {
        String action = interaction.get("action");
        String component = interaction.get("component");
        
        if (action != null && component != null) {
            metricsService.incrementUserInteraction(action, component);
        }
        
        return ResponseEntity.ok().build();
    }
}
