package com.sreehc.aiagent.infrastructure.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class OpenAiCompatibleImageGenerationProvider implements ImageGenerationProvider {
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public OpenAiCompatibleImageGenerationProvider(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String providerCode() {
        return "openai-compatible";
    }

    @Override
    public GeneratedImage generate(ImageRequest request) {
        if (request.apiKey() == null || request.apiKey().isBlank()) {
            throw new ModelProviderException("Image provider API key is required");
        }
        if (request.referenceImage() != null && request.referenceImage().length > 0) {
            throw new ModelProviderException("OpenAI-compatible image edit is not enabled in the baseline provider yet");
        }
        try {
            Map<String, Object> payload = Map.of(
                    "model", request.modelCode(),
                    "prompt", request.prompt(),
                    "size", request.size(),
                    "response_format", "b64_json"
            );
            HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(request.baseUrl() + "/images/generations"))
                    .timeout(Duration.ofSeconds(90))
                    .header("Authorization", "Bearer " + request.apiKey())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ModelProviderException("Image provider returned HTTP " + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            String b64 = root.path("data").path(0).path("b64_json").asText("");
            if (b64.isBlank()) {
                throw new ModelProviderException("Image provider response did not include b64_json");
            }
            return new GeneratedImage(Base64.getDecoder().decode(b64), "image/png", "png");
        } catch (Exception exception) {
            if (exception instanceof ModelProviderException modelProviderException) {
                throw modelProviderException;
            }
            throw new ModelProviderException("Image provider request failed", exception);
        }
    }
}
