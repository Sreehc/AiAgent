package com.sreehc.aiagent.infrastructure.knowledge;

public interface EmbeddingProvider {
    String providerCode();

    String embed(String content);

    default String embed(String content, String modelCode, String baseUrl, String apiKey) {
        return embed(content);
    }
}
