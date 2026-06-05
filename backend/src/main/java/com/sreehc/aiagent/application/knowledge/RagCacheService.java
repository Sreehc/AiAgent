package com.sreehc.aiagent.application.knowledge;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.app.AppProperties;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Optional;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RagCacheService {
    private static final String EMBEDDING_PREFIX = "aiagent:rag:embedding:";
    private static final String RETRIEVAL_PREFIX = "aiagent:rag:retrieval:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final AppProperties appProperties;

    public RagCacheService(StringRedisTemplate redisTemplate, ObjectMapper objectMapper, AppProperties appProperties) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.appProperties = appProperties;
    }

    public Optional<String> getEmbedding(String providerCode, String query) {
        return getString(EMBEDDING_PREFIX + hash(providerCode + "|" + query));
    }

    public void putEmbedding(String providerCode, String query, String embedding) {
        setString(
                EMBEDDING_PREFIX + hash(providerCode + "|" + query),
                embedding,
                Duration.ofSeconds(resolveEmbeddingCacheTtlSeconds())
        );
    }

    public Optional<KnowledgeBaseService.SearchResult> getSearchResult(String cacheKey) {
        return getString(RETRIEVAL_PREFIX + hash(cacheKey))
                .flatMap(this::deserializeSearchResult);
    }

    public void putSearchResult(String cacheKey, KnowledgeBaseService.SearchResult searchResult) {
        setString(
                RETRIEVAL_PREFIX + hash(cacheKey),
                serializeSearchResult(searchResult),
                Duration.ofSeconds(resolveRetrievalCacheTtlSeconds())
        );
    }

    private Optional<String> getString(String key) {
        try {
            String value = redisTemplate.opsForValue().get(key);
            if (value == null || value.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(value);
        } catch (Exception exception) {
            return Optional.empty();
        }
    }

    private void setString(String key, String value, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(key, value, ttl);
        } catch (Exception ignored) {
        }
    }

    private Optional<KnowledgeBaseService.SearchResult> deserializeSearchResult(String rawJson) {
        try {
            return Optional.of(objectMapper.readValue(rawJson, KnowledgeBaseService.SearchResult.class));
        } catch (Exception exception) {
            return Optional.empty();
        }
    }

    private String serializeSearchResult(KnowledgeBaseService.SearchResult value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize search result cache", exception);
        }
    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to hash cache key", exception);
        }
    }

    private long resolveEmbeddingCacheTtlSeconds() {
        if (appProperties.rag() == null || appProperties.rag().embeddingCacheTtlSeconds() == null) {
            return 3600L;
        }
        return appProperties.rag().embeddingCacheTtlSeconds();
    }

    private long resolveRetrievalCacheTtlSeconds() {
        if (appProperties.rag() == null || appProperties.rag().retrievalCacheTtlSeconds() == null) {
            return 300L;
        }
        return appProperties.rag().retrievalCacheTtlSeconds();
    }
}
