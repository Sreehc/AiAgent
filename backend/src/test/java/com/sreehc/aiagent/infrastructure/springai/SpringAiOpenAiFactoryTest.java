package com.sreehc.aiagent.infrastructure.springai;

import com.openai.client.OpenAIClient;
import com.openai.core.ClientOptions;
import java.lang.reflect.Field;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiEmbeddingModel;
import org.springframework.ai.openai.OpenAiImageModel;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SpringAiOpenAiFactoryTest {

    private final SpringAiOpenAiFactory factory = new SpringAiOpenAiFactory();

    @Test
    void shouldNormalizeBaseUrlAndCarryTimeoutsIntoChatClient() throws Exception {
        SpringAiRuntimeOptions options = new SpringAiRuntimeOptions(
                "https://example.com/v1/",
                "secret-key",
                "gpt-4o-mini",
                1234L,
                5678L,
                1,
                250L,
                false
        );

        OpenAiChatModel model = factory.createChatModel(options);
        ClientOptions clientOptions = clientOptionsOf(privateOpenAiClient(model, "openAiClient"));

        assertEquals("https://example.com/v1", model.getOptions().getBaseUrl());
        assertEquals("secret-key", model.getOptions().getApiKey());
        assertEquals("gpt-4o-mini", model.getOptions().getModel());
        assertEquals("https://example.com/v1", clientOptions.baseUrl());
        assertEquals("secret-key", clientOptions.apiKey().orElseThrow());
        assertEquals(Duration.ofMillis(1234L), clientOptions.timeout().connect());
        assertEquals(Duration.ofMillis(5678L), clientOptions.timeout().read());
        assertEquals(Duration.ofMillis(5678L), clientOptions.timeout().write());
        assertEquals(Duration.ofMillis(6912L), clientOptions.timeout().request());
    }

    @Test
    void shouldRejectBlankBaseUrlForEmbeddingModel() {
        SpringAiRuntimeOptions options = new SpringAiRuntimeOptions(
                "  ",
                "secret-key",
                "text-embedding-3-small",
                5000L,
                15000L,
                1,
                250L,
                false
        );

        assertThrows(IllegalArgumentException.class, () -> factory.createEmbeddingModel(options));
    }

    @Test
    void shouldRejectBlankApiKeyForImageModel() {
        SpringAiRuntimeOptions options = new SpringAiRuntimeOptions(
                "https://example.com/v1",
                " ",
                "gpt-image-1",
                5000L,
                15000L,
                1,
                250L,
                false
        );

        assertThrows(IllegalArgumentException.class, () -> factory.createImageModel(options));
    }

    @Test
    void shouldCreateEmbeddingAndImageModelsWithNormalizedRuntimeOptions() throws Exception {
        SpringAiRuntimeOptions embeddingOptions = new SpringAiRuntimeOptions(
                "https://embedding.example.com/v1/",
                "embedding-key",
                "text-embedding-3-small",
                700L,
                1700L,
                1,
                250L,
                false
        );
        SpringAiRuntimeOptions imageOptions = new SpringAiRuntimeOptions(
                "https://image.example.com/v1/",
                "image-key",
                "gpt-image-1",
                800L,
                1800L,
                1,
                250L,
                false
        );

        OpenAiEmbeddingModel embeddingModel = factory.createEmbeddingModel(embeddingOptions);
        OpenAiImageModel imageModel = factory.createImageModel(imageOptions);

        assertEquals("https://embedding.example.com/v1", embeddingModel.getOptions().getBaseUrl());
        assertEquals("embedding-key", embeddingModel.getOptions().getApiKey());
        assertEquals("text-embedding-3-small", embeddingModel.getOptions().getModel());
        assertEquals(Duration.ofMillis(2400L), clientOptionsOf(privateOpenAiClient(embeddingModel, "openAiClient")).timeout().request());

        assertEquals("https://image.example.com/v1", imageModel.getOptions().getBaseUrl());
        assertEquals("image-key", imageModel.getOptions().getApiKey());
        assertEquals("gpt-image-1", imageModel.getOptions().getModel());
        assertEquals(Duration.ofMillis(2600L), clientOptionsOf(privateOpenAiClient(imageModel, "openAiClient")).timeout().request());
    }

    @Test
    void shouldNormalizeRetryAndObservationSettingsIntoResolvedRuntimeOptions() {
        SpringAiOpenAiFactory.ResolvedRuntimeOptions options = factory.resolveRuntimeOptions(new SpringAiRuntimeOptions(
                "https://example.com/v1/",
                "secret-key",
                "gpt-4o-mini",
                1234L,
                5678L,
                99,
                0L,
                null
        ));

        assertEquals(5, options.retryMaxAttempts());
        assertEquals(Duration.ofMillis(250L), options.retryBackoff());
        assertEquals(false, options.observationEnabled());
        assertEquals(true, options.retryEnabled());
    }

    private static OpenAIClient privateOpenAiClient(Object model, String fieldName) throws Exception {
        Field field = model.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        return (OpenAIClient) field.get(model);
    }

    private static ClientOptions clientOptionsOf(OpenAIClient openAiClient) throws Exception {
        Field field = openAiClient.getClass().getDeclaredField("clientOptions");
        field.setAccessible(true);
        return (ClientOptions) field.get(openAiClient);
    }
}
