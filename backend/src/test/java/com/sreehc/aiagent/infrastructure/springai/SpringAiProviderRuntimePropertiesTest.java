package com.sreehc.aiagent.infrastructure.springai;

import com.sreehc.aiagent.app.AppProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SpringAiProviderRuntimePropertiesTest {

    @Test
    void shouldDefaultRetrySettingsAndKeepExistingTimeoutDefaults() {
        AppProperties.Embedding embedding = new AppProperties.Embedding(
                "openai-compatible",
                "text-embedding-3-small",
                "https://api.openai.com/v1",
                "secret",
                1536,
                null,
                null,
                null,
                null,
                null
        );

        assertEquals(5000L, embedding.connectTimeoutMillis());
        assertEquals(15000L, embedding.readTimeoutMillis());
        assertEquals(1, embedding.retryMaxAttempts());
        assertEquals(250L, embedding.retryBackoffMillis());
        assertFalse(embedding.observationEnabled());
    }

    @Test
    void shouldCarryObservationAndRetrySettingsPerProviderFamily() {
        AppProperties.Chat chat = new AppProperties.Chat(
                "openai-compatible",
                "gpt-4o-mini",
                "https://api.openai.com/v1",
                "chat-secret",
                3210L,
                6543L,
                3,
                800L,
                true
        );
        AppProperties.Embedding embedding = new AppProperties.Embedding(
                "openai-compatible",
                "text-embedding-3-small",
                "https://api.openai.com/v1",
                "embedding-secret",
                1536,
                1234L,
                5678L,
                2,
                500L,
                false
        );
        AppProperties.Image image = new AppProperties.Image(
                "openai-compatible",
                "gpt-image-1",
                "https://api.openai.com/v1",
                "image-secret",
                2222L,
                7777L,
                4,
                900L,
                true
        );

        assertEquals(3, chat.retryMaxAttempts());
        assertEquals(800L, chat.retryBackoffMillis());
        assertTrue(chat.observationEnabled());
        assertEquals(2, embedding.retryMaxAttempts());
        assertEquals(500L, embedding.retryBackoffMillis());
        assertFalse(embedding.observationEnabled());
        assertEquals(4, image.retryMaxAttempts());
        assertEquals(900L, image.retryBackoffMillis());
        assertTrue(image.observationEnabled());
    }
}
