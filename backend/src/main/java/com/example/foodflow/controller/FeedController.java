package com.example.foodflow.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/feed")
public class FeedController {
    @GetMapping
    public ResponseEntity<List<Object>> getFeed() {
        // Return an empty list for now; replace with real feed logic as needed
        return ResponseEntity.ok(Collections.emptyList());
    }
}

