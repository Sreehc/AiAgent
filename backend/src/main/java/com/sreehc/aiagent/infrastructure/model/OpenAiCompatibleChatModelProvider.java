package com.sreehc.aiagent.infrastructure.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class OpenAiCompatibleChatModelProvider implements ChatModelProvider {
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public OpenAiCompatibleChatModelProvider(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String providerCode() {
        return "openai-compatible";
    }

    @Override
    public ChatCompletion complete(ChatRequest request) {
        if (request.apiKey() == null || request.apiKey().isBlank()) {
            throw new ModelProviderException("Chat provider API key is required");
        }
        try {
            Map<String, Object> payload = Map.of(
                    "model", request.modelCode(),
                    "messages", List.of(Map.of("role", "user", "content", request.prompt()))
            );
            HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(request.baseUrl() + "/chat/completions"))
                    .timeout(Duration.ofSeconds(60))
                    .header("Authorization", "Bearer " + request.apiKey())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ModelProviderException("Chat provider returned HTTP " + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            String text = root.path("choices").path(0).path("message").path("content").asText("");
            return new ChatCompletion(text);
        } catch (Exception exception) {
            if (exception instanceof ModelProviderException modelProviderException) {
                throw modelProviderException;
            }
            throw new ModelProviderException("Chat provider request failed", exception);
        }
    }
}
