package com.sreehc.aiagent.infrastructure.knowledge;

import com.sreehc.aiagent.app.AppProperties;
import com.sreehc.aiagent.infrastructure.springai.SpringAiOpenAiFactory;
import com.sreehc.aiagent.infrastructure.springai.SpringAiRuntimeOptions;
import java.util.List;
import java.util.function.Supplier;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.openai.OpenAiEmbeddingModel;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SpringAiEmbeddingProviderTest {

    @Test
    void shouldConvertEmbeddingResponseToPgvectorLiteral() {
        SpringAiOpenAiFactory factory = mock(SpringAiOpenAiFactory.class);
        OpenAiEmbeddingModel model = mock(OpenAiEmbeddingModel.class);
        when(factory.createEmbeddingModel(any())).thenReturn(model);
        when(factory.executeWithRetry(any(), any())).thenAnswer(invocation -> ((Supplier<?>) invocation.getArgument(1)).get());
        when(model.call(any(EmbeddingRequest.class))).thenReturn(new EmbeddingResponse(
                List.of(new Embedding(new float[]{0.1f, 0.2f, 0.3f}, 0))
        ));
        SpringAiEmbeddingProvider provider = new SpringAiEmbeddingProvider(factory, appProperties());

        String vector = provider.embed("hello world");

        ArgumentCaptor<SpringAiRuntimeOptions> runtimeOptionsCaptor = ArgumentCaptor.forClass(SpringAiRuntimeOptions.class);
        verify(factory).createEmbeddingModel(runtimeOptionsCaptor.capture());
        assertEquals("https://api.openai.com/v1", runtimeOptionsCaptor.getValue().baseUrl());
        assertEquals("secret", runtimeOptionsCaptor.getValue().apiKey());
        assertEquals("text-embedding-3-small", runtimeOptionsCaptor.getValue().model());
        assertEquals(2, runtimeOptionsCaptor.getValue().retryMaxAttempts());
        assertEquals(500L, runtimeOptionsCaptor.getValue().retryBackoffMillis());
        assertEquals(true, runtimeOptionsCaptor.getValue().observationEnabled());
        assertEquals("[0.1,0.2,0.3]", vector);
    }

    @Test
    void shouldNormalizeBlankInputForPerUserRuntimePath() {
        SpringAiOpenAiFactory factory = mock(SpringAiOpenAiFactory.class);
        OpenAiEmbeddingModel model = mock(OpenAiEmbeddingModel.class);
        when(factory.createEmbeddingModel(any())).thenReturn(model);
        when(factory.executeWithRetry(any(), any())).thenAnswer(invocation -> ((Supplier<?>) invocation.getArgument(1)).get());
        when(model.call(any(EmbeddingRequest.class))).thenReturn(new EmbeddingResponse(
                List.of(new Embedding(new float[]{1.0f, 2.0f}, 0))
        ));
        SpringAiEmbeddingProvider provider = new SpringAiEmbeddingProvider(factory, appProperties());

        String vector = provider.embed("   ", "text-embedding-3-small", "https://example.com/v1", "user-key");

        ArgumentCaptor<EmbeddingRequest> requestCaptor = ArgumentCaptor.forClass(EmbeddingRequest.class);
        verify(model).call(requestCaptor.capture());
        assertEquals(List.of(" "), requestCaptor.getValue().getInstructions());
        assertEquals("[1.0,2.0]", vector);
    }

    @Test
    void shouldFailWhenConfiguredDimensionDoesNotMatchResponse() {
        SpringAiOpenAiFactory factory = mock(SpringAiOpenAiFactory.class);
        OpenAiEmbeddingModel model = mock(OpenAiEmbeddingModel.class);
        when(factory.createEmbeddingModel(any())).thenReturn(model);
        when(factory.executeWithRetry(any(), any())).thenAnswer(invocation -> ((Supplier<?>) invocation.getArgument(1)).get());
        when(model.call(any(EmbeddingRequest.class))).thenReturn(new EmbeddingResponse(
                List.of(new Embedding(new float[]{0.1f, 0.2f}, 0))
        ));
        SpringAiEmbeddingProvider provider = new SpringAiEmbeddingProvider(factory, appProperties());

        EmbeddingProviderException exception = assertThrows(EmbeddingProviderException.class, () -> provider.embed("hello"));

        assertEquals("Embedding vector dimension 2 does not match configured dimension 3", exception.getMessage());
    }

    private static AppProperties appProperties() {
        return new AppProperties(
                new AppProperties.Auth(7200L, 5, 600L),
                new AppProperties.Storage("http://localhost:9000", "minioadmin", "minioadmin", "aiagent", 900L),
                new AppProperties.Embedding("openai-compatible", "text-embedding-3-small", "https://api.openai.com/v1", "secret", 3, 1234L, 5678L, 2, 500L, true),
                new AppProperties.Kafka("localhost:9092", "aiagent.knowledge.index", "aiagent-backend"),
                new AppProperties.Rag(3600L, 300L, 1500L),
                new AppProperties.Chat("local-mock", "claude-sonnet-4-6", "", ""),
                new AppProperties.Image("local-mock", "image-generation-default", "", ""),
                new AppProperties.Mcp("localhost", false, ""),
                new AppProperties.Bootstrap(true),
                new AppProperties.Secret("")
        );
    }
}
