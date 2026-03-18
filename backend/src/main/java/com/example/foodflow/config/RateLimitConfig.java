package com.example.foodflow.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for rate limiting functionality.
 * Allows easy adjustment of rate limits without code changes.
 */
@Component
@ConfigurationProperties(prefix = "app.ratelimit")
public class RateLimitConfig {

    private boolean enabled = true;
    private int burstCapacity = 5;

    private User user = new User();
    private Ip ip = new Ip();
    private OpenAI openai = new OpenAI();

    public static class User {
        private int requestsPerMinute = 10;

        public int getRequestsPerMinute() {
            return requestsPerMinute;
        }

        public void setRequestsPerMinute(int requestsPerMinute) {
            this.requestsPerMinute = requestsPerMinute;
        }
    }

    public static class Ip {
        private int requestsPerMinute = 30;

        public int getRequestsPerMinute() {
            return requestsPerMinute;
        }

        public void setRequestsPerMinute(int requestsPerMinute) {
            this.requestsPerMinute = requestsPerMinute;
        }
    }

    public static class OpenAI {
        private int requestsPerMinute = 100;

        public int getRequestsPerMinute() {
            return requestsPerMinute;
        }

        public void setRequestsPerMinute(int requestsPerMinute) {
            this.requestsPerMinute = requestsPerMinute;
        }
    }

    // Getters and setters
    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getBurstCapacity() {
        return burstCapacity;
    }

    public void setBurstCapacity(int burstCapacity) {
        this.burstCapacity = burstCapacity;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Ip getIp() {
        return ip;
    }

    public void setIp(Ip ip) {
        this.ip = ip;
    }

    public OpenAI getOpenai() {
        return openai;
    }

    public void setOpenai(OpenAI openai) {
        this.openai = openai;
    }
}