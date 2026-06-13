package com.sreehc.aiagent.infrastructure.knowledge;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.sreehc.aiagent.app.AppProperties;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class OpenAiCompatibleEmbeddingProvider implements EmbeddingProvider {
    private final RestClient restClient;
    private final AppProperties.Embedding embeddingProperties;

    public OpenAiCompatibleEmbeddingProvider(RestClient.Builder restClientBuilder, AppProperties appProperties) {
        this.embeddingProperties = appProperties.embedding();
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) resolveConnectTimeoutMillis(appProperties));
        requestFactory.setReadTimeout((int) resolveReadTimeoutMillis(appProperties));
        this.restClient = restClientBuilder
                .baseUrl(resolveBaseUrl(appProperties))
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public String providerCode() {
        return "openai-compatible";
    }

    @Override
    public String embed(String content) {
        if (embeddingProperties == null) {
            throw new EmbeddingProviderException("Embedding configuration is missing");
        }
        if (isBlank(embeddingProperties.apiKey())) {
            throw new EmbeddingProviderException("Embedding API key is not configured for openai-compatible provider");
        }
        if (isBlank(embeddingProperties.modelCode())) {
            throw new EmbeddingProviderException("Embedding model code is not configured");
        }

        try {
            EmbeddingResponse response = restClient.post()
                    .uri("/embeddings")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + embeddingProperties.apiKey())
                    .body(new EmbeddingRequest(embeddingProperties.modelCode(), sanitizeInput(content)))
                    .retrieve()
                    .body(EmbeddingResponse.class);

            return vectorLiteralFromResponse(response, embeddingProperties.dimension());
        } catch (EmbeddingProviderException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new EmbeddingProviderException("Failed to call embedding provider", exception);
        }
    }

    @Override
    public String embed(String content, String modelCode, String baseUrl, String apiKey) {
        if (isBlank(apiKey)) {
            throw new EmbeddingProviderException("Embedding API key is not configured for openai-compatible provider");
        }
        if (isBlank(modelCode)) {
            throw new EmbeddingProviderException("Embedding model code is not configured");
        }
        try {
            EmbeddingResponse response = RestClient.builder()
                    .baseUrl(normalizeBaseUrl(baseUrl))
                    .build()
                    .post()
                    .uri("/embeddings")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + apiKey)
                    .body(new EmbeddingRequest(modelCode, sanitizeInput(content)))
                    .retrieve()
                    .body(EmbeddingResponse.class);
            return vectorLiteralFromResponse(response, null);
        } catch (EmbeddingProviderException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new EmbeddingProviderException("Failed to call embedding provider", exception);
        }
    }

    private static long resolveConnectTimeoutMillis(AppProperties appProperties) {
        if (appProperties.embedding() == null || appProperties.embedding().connectTimeoutMillis() == null) {
            return 5000L;
        }
        return appProperties.embedding().connectTimeoutMillis();
    }

    private static long resolveReadTimeoutMillis(AppProperties appProperties) {
        if (appProperties.embedding() == null || appProperties.embedding().readTimeoutMillis() == null) {
            return 15000L;
        }
        return appProperties.embedding().readTimeoutMillis();
    }

    private static String resolveBaseUrl(AppProperties appProperties) {
        if (appProperties.embedding() == null || isBlank(appProperties.embedding().baseUrl())) {
            throw new EmbeddingProviderException("Embedding base URL is not configured");
        }
        return normalizeBaseUrl(appProperties.embedding().baseUrl());
    }

    private static String normalizeBaseUrl(String rawBaseUrl) {
        if (isBlank(rawBaseUrl)) {
            throw new EmbeddingProviderException("Embedding base URL is not configured");
        }
        String baseUrl = rawBaseUrl.trim();
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private static String vectorLiteralFromResponse(EmbeddingResponse response, Integer expectedDimension) {
        if (response == null || response.data() == null || response.data().isEmpty()) {
            throw new EmbeddingProviderException("Embedding response is empty");
        }
        List<Double> vector = response.data().getFirst().embedding();
        if (vector == null || vector.isEmpty()) {
            throw new EmbeddingProviderException("Embedding vector is empty");
        }
        if (expectedDimension != null && vector.size() != expectedDimension) {
            throw new EmbeddingProviderException("Embedding vector dimension " + vector.size()
                    + " does not match configured dimension " + expectedDimension);
        }
        return toVectorLiteral(vector);
    }

    private static String sanitizeInput(String content) {
        return isBlank(content) ? " " : content;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String toVectorLiteral(List<Double> vector) {
        StringBuilder builder = new StringBuilder("[");
        for (int index = 0; index < vector.size(); index++) {
            if (index > 0) {
                builder.append(',');
            }
            builder.append(vector.get(index));
        }
        builder.append(']');
        return builder.toString();
    }

    private record EmbeddingRequest(
            String model,
            String input
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record EmbeddingResponse(
            List<EmbeddingData> data
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record EmbeddingData(
            List<Double> embedding
    ) {
    }
}
