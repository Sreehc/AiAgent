package com.sreehc.aiagent.infrastructure.knowledge;

public interface EmbeddingProvider {
    String providerCode();

    String embed(String content);
}
