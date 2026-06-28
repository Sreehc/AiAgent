package com.sreehc.aiagent.infrastructure.model;

import com.sreehc.aiagent.app.AppProperties;
import com.sreehc.aiagent.infrastructure.springai.SpringAiOpenAiFactory;
import com.sreehc.aiagent.infrastructure.springai.SpringAiRuntimeOptions;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Component;

@Component
public class SpringAiChatModelProvider implements ChatModelProvider {
    private final SpringAiOpenAiFactory factory;
    private final AppProperties.Chat chatProperties;

    public SpringAiChatModelProvider(SpringAiOpenAiFactory factory, AppProperties appProperties) {
        this.factory = factory;
        this.chatProperties = appProperties.chat();
    }

    @Override
    public String providerCode() {
        return "openai-compatible";
    }

    @Override
    public ChatCompletion complete(ChatRequest request) {
        try {
            SpringAiRuntimeOptions runtimeOptions = new SpringAiRuntimeOptions(
                    request.baseUrl(),
                    request.apiKey(),
                    request.modelCode(),
                    chatProperties == null ? null : chatProperties.connectTimeoutMillis(),
                    chatProperties == null ? null : chatProperties.readTimeoutMillis(),
                    chatProperties == null ? null : chatProperties.retryMaxAttempts(),
                    chatProperties == null ? null : chatProperties.retryBackoffMillis(),
                    chatProperties == null ? null : chatProperties.observationEnabled()
            );
            OpenAiChatModel chatModel = factory.createChatModel(runtimeOptions);
            ChatResponse response = factory.executeWithRetry(runtimeOptions,
                    () -> chatModel.call(new Prompt(new UserMessage(request.prompt()))));
            return new ChatCompletion(extractText(response));
        } catch (ModelProviderException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ModelProviderException("Chat provider request failed", exception);
        }
    }

    private static String extractText(ChatResponse response) {
        if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
            return "";
        }
        String text = response.getResult().getOutput().getText();
        return text == null ? "" : text;
    }
}
