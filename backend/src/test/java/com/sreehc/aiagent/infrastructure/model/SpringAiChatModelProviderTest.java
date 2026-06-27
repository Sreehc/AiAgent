package com.sreehc.aiagent.infrastructure.model;

import com.sreehc.aiagent.app.AppProperties;
import com.sreehc.aiagent.infrastructure.springai.SpringAiOpenAiFactory;
import com.sreehc.aiagent.infrastructure.springai.SpringAiRuntimeOptions;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SpringAiChatModelProviderTest {

    @Test
    void shouldKeepOpenAiCompatibleProviderCode() {
        SpringAiChatModelProvider provider = new SpringAiChatModelProvider(mock(SpringAiOpenAiFactory.class), appProperties());

        assertEquals("openai-compatible", provider.providerCode());
    }

    @Test
    void shouldSendPromptAsSingleUserMessageAndMapResponseText() {
        SpringAiOpenAiFactory factory = mock(SpringAiOpenAiFactory.class);
        OpenAiChatModel chatModel = mock(OpenAiChatModel.class);
        when(factory.createChatModel(any())).thenReturn(chatModel);
        when(chatModel.call(any(Prompt.class))).thenReturn(new ChatResponse(
                java.util.List.of(new Generation(new AssistantMessage("result-text")))
        ));
        SpringAiChatModelProvider provider = new SpringAiChatModelProvider(factory, appProperties());

        ChatModelProvider.ChatCompletion completion = provider.complete(new ChatModelProvider.ChatRequest(
                "Explain the architecture",
                "gpt-4o-mini",
                "https://example.com/v1/",
                "secret-key"
        ));

        ArgumentCaptor<SpringAiRuntimeOptions> runtimeOptionsCaptor = ArgumentCaptor.forClass(SpringAiRuntimeOptions.class);
        verify(factory).createChatModel(runtimeOptionsCaptor.capture());
        assertEquals("https://example.com/v1/", runtimeOptionsCaptor.getValue().baseUrl());
        assertEquals("secret-key", runtimeOptionsCaptor.getValue().apiKey());
        assertEquals("gpt-4o-mini", runtimeOptionsCaptor.getValue().model());
        assertEquals(3210L, runtimeOptionsCaptor.getValue().connectTimeoutMillis());
        assertEquals(6543L, runtimeOptionsCaptor.getValue().readTimeoutMillis());

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        verify(chatModel).call(promptCaptor.capture());
        Prompt prompt = promptCaptor.getValue();
        assertEquals(1, prompt.getInstructions().size());
        assertEquals("Explain the architecture", prompt.getUserMessage().getText());
        assertEquals("result-text", completion.text());
    }

    @Test
    void shouldWrapSpringAiFailuresAsModelProviderException() {
        SpringAiOpenAiFactory factory = mock(SpringAiOpenAiFactory.class);
        OpenAiChatModel chatModel = mock(OpenAiChatModel.class);
        when(factory.createChatModel(any())).thenReturn(chatModel);
        when(chatModel.call(any(Prompt.class))).thenThrow(new IllegalStateException("upstream failed"));
        SpringAiChatModelProvider provider = new SpringAiChatModelProvider(factory, appProperties());

        ModelProviderException exception = assertThrows(ModelProviderException.class, () -> provider.complete(
                new ChatModelProvider.ChatRequest(
                        "hello",
                        "gpt-4o-mini",
                        "https://example.com/v1",
                        "secret-key"
                )
        ));

        assertEquals("Chat provider request failed", exception.getMessage());
        assertEquals("upstream failed", exception.getCause().getMessage());
    }

    private static AppProperties appProperties() {
        return new AppProperties(
                new AppProperties.Auth(7200L, 5, 600L),
                new AppProperties.Storage("http://localhost:9000", "minioadmin", "minioadmin", "aiagent", 900L),
                new AppProperties.Embedding("local-mock", "text-embedding-3-small", "https://api.openai.com/v1", "", 1536, 5000L, 15000L),
                new AppProperties.Kafka("localhost:9092", "aiagent.knowledge.index", "aiagent-backend"),
                new AppProperties.Rag(3600L, 300L, 1500L),
                new AppProperties.Chat("openai-compatible", "gpt-4o-mini", "https://api.openai.com/v1", "secret", 3210L, 6543L),
                new AppProperties.Image("local-mock", "image-generation-default", "", ""),
                new AppProperties.Mcp("localhost", false, ""),
                new AppProperties.Bootstrap(true),
                new AppProperties.Secret("")
        );
    }
}
