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
        Email email,
        Run run,
        Bootstrap bootstrap,
        Secret secret
) {
    public AppProperties(
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
        this(auth, storage, embedding, kafka, rag, chat, image, mcp,
                new Email("log", "no-reply@aiagent.local", "http://localhost:5173/reset-password", "localhost", 1025, null, null, false, false, 5000L, 10000L),
                new Run(3, 8, 10L),
                bootstrap,
                secret);
    }

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

    public record Email(
            String provider,
            String from,
            String resetBaseUrl,
            String host,
            Integer port,
            String username,
            String password,
            Boolean startTls,
            Boolean ssl,
            Long connectTimeoutMillis,
            Long readTimeoutMillis
    ) {
    }

    public record Run(
            Integer maxPlanningRounds,
            Integer maxPlanSteps,
            Long staleTimeoutMinutes
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
