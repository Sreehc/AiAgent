package com.sreehc.aiagent.infrastructure.knowledge;

import com.sreehc.aiagent.app.AppProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LocalMockEmbeddingProviderTest {

    @Test
    void shouldGenerateConfiguredDimensionVector() {
        LocalMockEmbeddingProvider provider = new LocalMockEmbeddingProvider(appProperties(8));

        String vector = provider.embed("alpha beta alpha");

        assertEquals(8, vector.substring(1, vector.length() - 1).split(",").length);
        assertTrue(vector.startsWith("["));
        assertTrue(vector.endsWith("]"));
    }

    @Test
    void shouldFallbackForBlankContent() {
        LocalMockEmbeddingProvider provider = new LocalMockEmbeddingProvider(appProperties(4));

        String vector = provider.embed("   ");

        assertEquals("[1.0,0.0,0.0,0.0]", vector);
    }

    private static AppProperties appProperties(int dimension) {
        return new AppProperties(
                new AppProperties.Auth(7200L),
                new AppProperties.Storage("http://localhost:9000", "minioadmin", "minioadmin", "aiagent"),
                new AppProperties.Embedding("local-mock", "text-embedding-3-small", "https://api.openai.com/v1", "", dimension, 5000L, 15000L),
                new AppProperties.Kafka("localhost:9092", "aiagent.knowledge.index", "aiagent-backend")
        );
    }
}
