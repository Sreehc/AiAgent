package com.sreehc.aiagent.application.auth;

import com.sreehc.aiagent.app.AppProperties;
import java.time.Duration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class LoginRateLimiter {
    private static final String PREFIX = "aiagent:auth:login-fail:";

    private final StringRedisTemplate redisTemplate;
    private final AppProperties appProperties;

    public LoginRateLimiter(StringRedisTemplate redisTemplate, AppProperties appProperties) {
        this.redisTemplate = redisTemplate;
        this.appProperties = appProperties;
    }

    public boolean isBlocked(String username, String loginIp) {
        String value = redisTemplate.opsForValue().get(key(username, loginIp));
        if (value == null || value.isBlank()) {
            return false;
        }
        try {
            return Integer.parseInt(value) >= limit();
        } catch (NumberFormatException ignored) {
            return false;
        }
    }

    public void recordFailure(String username, String loginIp) {
        String key = key(username, loginIp);
        Long attempts = redisTemplate.opsForValue().increment(key);
        if (attempts != null && attempts == 1) {
            redisTemplate.expire(key, Duration.ofSeconds(windowSeconds()));
        }
    }

    public void clear(String username, String loginIp) {
        redisTemplate.delete(key(username, loginIp));
    }

    private String key(String username, String loginIp) {
        String normalizedUsername = username == null ? "unknown" : username.trim().toLowerCase();
        String normalizedIp = loginIp == null || loginIp.isBlank() ? "unknown" : loginIp.trim();
        return PREFIX + normalizedUsername + ":" + normalizedIp;
    }

    private int limit() {
        Integer configured = appProperties.auth().loginFailureLimit();
        return configured == null || configured <= 0 ? 5 : configured;
    }

    private long windowSeconds() {
        Long configured = appProperties.auth().loginFailureWindowSeconds();
        return configured == null || configured <= 0 ? 600 : configured;
    }
}
