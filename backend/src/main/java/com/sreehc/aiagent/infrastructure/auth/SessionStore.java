package com.sreehc.aiagent.infrastructure.auth;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.domain.auth.SessionUser;
import java.time.Duration;
import java.util.Optional;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class SessionStore {
    private static final String PREFIX = "aiagent:session:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public SessionStore(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public void save(String accessToken, SessionUser sessionUser, long ttlSeconds) {
        redisTemplate.opsForValue().set(key(accessToken), write(sessionUser), Duration.ofSeconds(ttlSeconds));
    }

    public Optional<SessionUser> find(String accessToken) {
        String value = redisTemplate.opsForValue().get(key(accessToken));
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(read(value));
    }

    public void delete(String accessToken) {
        redisTemplate.delete(key(accessToken));
    }

    private String key(String accessToken) {
        return PREFIX + accessToken;
    }

    private String write(SessionUser sessionUser) {
        try {
            return objectMapper.writeValueAsString(sessionUser);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize session", exception);
        }
    }

    private SessionUser read(String raw) {
        try {
            return objectMapper.readValue(raw, SessionUser.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to deserialize session", exception);
        }
    }
}

