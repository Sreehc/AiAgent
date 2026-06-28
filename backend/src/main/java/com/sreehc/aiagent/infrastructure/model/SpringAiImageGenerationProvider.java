package com.sreehc.aiagent.infrastructure.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.app.AppProperties;
import com.sreehc.aiagent.infrastructure.springai.SpringAiOpenAiFactory;
import com.sreehc.aiagent.infrastructure.springai.SpringAiRuntimeOptions;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import org.springframework.ai.image.ImagePrompt;
import org.springframework.ai.image.ImageResponse;
import org.springframework.ai.openai.OpenAiImageModel;
import org.springframework.ai.openai.OpenAiImageOptions;
import org.springframework.stereotype.Component;

@Component
public class SpringAiImageGenerationProvider implements ImageGenerationProvider {
    private static final long DEFAULT_CONNECT_TIMEOUT_MILLIS = 5000L;
    private static final long DEFAULT_READ_TIMEOUT_MILLIS = 15000L;

    private final SpringAiOpenAiFactory factory;
    private final ObjectMapper objectMapper;
    private final AppProperties.Image imageProperties;
    private final HttpClient httpClient;
    private final Duration requestTimeout;

    public SpringAiImageGenerationProvider(
            SpringAiOpenAiFactory factory,
            AppProperties appProperties,
            ObjectMapper objectMapper
    ) {
        this.factory = factory;
        this.objectMapper = objectMapper;
        this.imageProperties = appProperties.image();
        Duration connectTimeout = Duration.ofMillis(connectTimeoutMillis(this.imageProperties));
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(connectTimeout)
                .build();
        this.requestTimeout = connectTimeout.plus(Duration.ofMillis(readTimeoutMillis(this.imageProperties)));
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
            return hasReferenceImage(request) ? generateEdit(request) : generateImage(request);
        } catch (ModelProviderException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ModelProviderException("Image provider request failed", exception);
        }
    }

    private GeneratedImage generateImage(ImageRequest request) {
        SpringAiRuntimeOptions runtimeOptions = new SpringAiRuntimeOptions(
                request.baseUrl(),
                request.apiKey(),
                request.modelCode(),
                connectTimeoutMillis(imageProperties),
                readTimeoutMillis(imageProperties),
                imageProperties == null ? null : imageProperties.retryMaxAttempts(),
                imageProperties == null ? null : imageProperties.retryBackoffMillis(),
                imageProperties == null ? null : imageProperties.observationEnabled()
        );
        OpenAiImageModel imageModel = factory.createImageModel(runtimeOptions);
        ImageResponse response = factory.executeWithRetry(runtimeOptions, () -> imageModel.call(new ImagePrompt(
                        request.prompt(),
                        OpenAiImageOptions.builder()
                                .size(request.size())
                                .responseFormat("b64_json")
                                .build()
                )));
        String b64 = extractB64Json(response);
        return new GeneratedImage(Base64.getDecoder().decode(b64), "image/png", "png");
    }

    private GeneratedImage generateEdit(ImageRequest request) throws Exception {
        HttpResponse<String> response = httpClient.send(buildEditRequest(request), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ModelProviderException("Image provider returned HTTP " + response.statusCode());
        }
        JsonNode root = objectMapper.readTree(response.body());
        String b64 = root.path("data").path(0).path("b64_json").asText("");
        if (b64.isBlank()) {
            throw new ModelProviderException("Image provider response did not include b64_json");
        }
        return new GeneratedImage(Base64.getDecoder().decode(b64), "image/png", "png");
    }

    private HttpRequest buildEditRequest(ImageRequest request) {
        String boundary = "----AiAgentBoundary" + UUID.randomUUID().toString().replace("-", "");
        byte[] body = multipartBody(boundary, request);
        return HttpRequest.newBuilder(URI.create(request.baseUrl() + "/images/edits"))
                .timeout(requestTimeout)
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

    private static String extractB64Json(ImageResponse response) {
        if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
            throw new ModelProviderException("Image provider response is empty");
        }
        String b64 = response.getResult().getOutput().getB64Json();
        if (b64 == null || b64.isBlank()) {
            throw new ModelProviderException("Image provider response did not include b64_json");
        }
        return b64;
    }

    private static boolean hasReferenceImage(ImageRequest request) {
        return request.referenceImage() != null && request.referenceImage().length > 0;
    }

    private static long connectTimeoutMillis(AppProperties.Image imageProperties) {
        return positiveTimeoutOrDefault(imageProperties == null ? null : imageProperties.connectTimeoutMillis(),
                DEFAULT_CONNECT_TIMEOUT_MILLIS,
                "Image provider connect timeout must be positive");
    }

    private static long readTimeoutMillis(AppProperties.Image imageProperties) {
        return positiveTimeoutOrDefault(imageProperties == null ? null : imageProperties.readTimeoutMillis(),
                DEFAULT_READ_TIMEOUT_MILLIS,
                "Image provider read timeout must be positive");
    }

    private static long positiveTimeoutOrDefault(Long value, long defaultValue, String message) {
        if (value == null) {
            return defaultValue;
        }
        if (value <= 0) {
            throw new IllegalArgumentException(message);
        }
        return value;
    }

    private void appendField(StringBuilder builder, String boundary, String name, String value) {
        builder.append("--").append(boundary).append("\r\n")
                .append("Content-Disposition: form-data; name=\"").append(name).append("\"\r\n\r\n")
                .append(value == null ? "" : value)
                .append("\r\n");
    }
}
