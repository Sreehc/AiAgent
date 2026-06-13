package com.sreehc.aiagent.infrastructure.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
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
        try {
            HttpRequest httpRequest = request.referenceImage() != null && request.referenceImage().length > 0
                    ? buildEditRequest(request)
                    : buildGenerationRequest(request);
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

    private HttpRequest buildGenerationRequest(ImageRequest request) throws Exception {
        Map<String, Object> payload = Map.of(
                "model", request.modelCode(),
                "prompt", request.prompt(),
                "size", request.size(),
                "response_format", "b64_json"
        );
        return HttpRequest.newBuilder(URI.create(request.baseUrl() + "/images/generations"))
                .timeout(Duration.ofSeconds(90))
                .header("Authorization", "Bearer " + request.apiKey())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .build();
    }

    private HttpRequest buildEditRequest(ImageRequest request) {
        String boundary = "----AiAgentBoundary" + UUID.randomUUID().toString().replace("-", "");
        byte[] body = multipartBody(boundary, request);
        return HttpRequest.newBuilder(URI.create(request.baseUrl() + "/images/edits"))
                .timeout(Duration.ofSeconds(120))
                .header("Authorization", "Bearer " + request.apiKey())
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();
    }

    private byte[] multipartBody(String boundary, ImageRequest request) {
        StringBuilder head = new StringBuilder();
        appendField(head, boundary, "model", request.modelCode());
        appendField(head, boundary, "prompt", request.prompt());
        appendField(head, boundary, "size", request.size());
        appendField(head, boundary, "response_format", "b64_json");
        head.append("--").append(boundary).append("\r\n")
                .append("Content-Disposition: form-data; name=\"image\"; filename=\"reference.png\"\r\n")
                .append("Content-Type: ").append(request.referenceMimeType() == null ? "image/png" : request.referenceMimeType()).append("\r\n\r\n");
        byte[] headBytes = head.toString().getBytes(StandardCharsets.UTF_8);
        byte[] tailBytes = ("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8);
        byte[] body = new byte[headBytes.length + request.referenceImage().length + tailBytes.length];
        System.arraycopy(headBytes, 0, body, 0, headBytes.length);
        System.arraycopy(request.referenceImage(), 0, body, headBytes.length, request.referenceImage().length);
        System.arraycopy(tailBytes, 0, body, headBytes.length + request.referenceImage().length, tailBytes.length);
        return body;
    }

    private void appendField(StringBuilder builder, String boundary, String name, String value) {
        builder.append("--").append(boundary).append("\r\n")
                .append("Content-Disposition: form-data; name=\"").append(name).append("\"\r\n\r\n")
                .append(value == null ? "" : value)
                .append("\r\n");
    }
}
