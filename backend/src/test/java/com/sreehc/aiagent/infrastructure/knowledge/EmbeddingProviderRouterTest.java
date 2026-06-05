package com.sreehc.aiagent.infrastructure.knowledge;

import com.sreehc.aiagent.app.AppProperties;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EmbeddingProviderRouterTest {

    @Test
    void shouldRouteToConfiguredProvider() {
        EmbeddingProvider provider = new FixedEmbeddingProvider("local-mock", "[0.1,0.2]");
        EmbeddingProviderRouter router = new EmbeddingProviderRouter(
                List.of(provider),
                appProperties("local-mock")
        );

        assertEquals("local-mock", router.providerCode());
        assertEquals("[0.1,0.2]", router.embed("hello"));
    }

    @Test
    void shouldRejectUnsupportedProvider() {
        assertThrows(
                EmbeddingProviderException.class,
                () -> new EmbeddingProviderRouter(
                        List.of(new FixedEmbeddingProvider("local-mock", "[1.0]")),
                        appProperties("openai-compatible")
                )
        );
    }

    private static AppProperties appProperties(String provider) {
        return new AppProperties(
                new AppProperties.Auth(7200L),
                new AppProperties.Storage("http://localhost:9000", "minioadmin", "minioadmin", "aiagent"),
                new AppProperties.Embedding(provider, "text-embedding-3-small", "https://api.openai.com/v1", "secret", 1536, 5000L, 15000L),
                new AppProperties.Kafka("localhost:9092", "aiagent.knowledge.index", "aiagent-backend")
        );
    }

    private record FixedEmbeddingProvider(String providerCode, String vector) implements EmbeddingProvider {
        @Override
        public String embed(String content) {
            return vector;
        }
    }
}
