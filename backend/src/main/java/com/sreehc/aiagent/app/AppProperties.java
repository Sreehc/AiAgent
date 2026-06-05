package com.sreehc.aiagent.app;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Auth auth,
        Storage storage,
        Embedding embedding,
        Kafka kafka,
        Rag rag
) {
    public record Auth(
            long sessionTtlSeconds
    ) {
    }

    public record Storage(
            String endpoint,
            String accessKey,
            String secretKey,
            String bucket
    ) {
    }

    public record Embedding(
            String provider,
            String modelCode,
            String baseUrl,
            String apiKey,
            Integer dimension,
            Long connectTimeoutMillis,
            Long readTimeoutMillis
    ) {
    }

    public record Kafka(
            String bootstrapServers,
            String knowledgeIndexTopic,
            String consumerGroup
    ) {
    }

    public record Rag(
            Long embeddingCacheTtlSeconds,
            Long retrievalCacheTtlSeconds,
            Long retrievalTimeoutMillis
    ) {
    }
}
