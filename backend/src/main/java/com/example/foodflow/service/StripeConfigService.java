package com.example.foodflow.service;
import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
@Service
@Slf4j
public class StripeConfigService {
    @Value("${stripe.api.key}")
    private String stripeApiKey;
    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
        log.info("Stripe API initialized successfully");
    }
    public String getApiKey() {
        return stripeApiKey;
    }
}
