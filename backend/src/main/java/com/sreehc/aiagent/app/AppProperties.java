package com.sreehc.aiagent.app;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Auth auth,
        Storage storage,
        Embedding embedding,
        Kafka kafka,
        Rag rag,
        Chat chat,
        Image image,
        Mcp mcp,
        Bootstrap bootstrap,
        Secret secret
) {
    public record Auth(
            long sessionTtlSeconds,
            Integer loginFailureLimit,
            Long loginFailureWindowSeconds
    ) {
    }

    public record Storage(
            String endpoint,
            String accessKey,
            String secretKey,
            String bucket,
            Long presignedUrlTtlSeconds
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

    public record Chat(
            String provider,
            String modelCode,
            String baseUrl,
            String apiKey
    ) {
    }

    public record Image(
            String provider,
            String modelCode,
            String baseUrl,
            String apiKey
    ) {
    }

    public record Mcp(
            String allowedHosts,
            Boolean allowPrivateNetwork,
            String allowedStdioExecutables
    ) {
    }

    public record Bootstrap(
            Boolean demoDataEnabled
    ) {
    }

    public record Secret(
            String encryptionKey
    ) {
    }
}
