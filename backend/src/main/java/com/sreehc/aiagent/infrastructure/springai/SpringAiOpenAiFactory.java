package com.sreehc.aiagent.infrastructure.springai;

import com.openai.client.OpenAIClient;
import com.openai.client.OpenAIClientImpl;
import com.openai.core.ClientOptions;
import com.openai.core.Timeout;
import java.time.Duration;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.OpenAiEmbeddingModel;
import org.springframework.ai.openai.OpenAiEmbeddingOptions;
import org.springframework.ai.openai.OpenAiImageModel;
import org.springframework.ai.openai.OpenAiImageOptions;
import org.springframework.ai.openai.http.okhttp.SpringAiOpenAiHttpClient;
import org.springframework.stereotype.Component;

@Component
public class SpringAiOpenAiFactory {
    private static final long DEFAULT_CONNECT_TIMEOUT_MILLIS = 5000L;
    private static final long DEFAULT_READ_TIMEOUT_MILLIS = 15000L;

    public OpenAiChatModel createChatModel(SpringAiRuntimeOptions runtimeOptions) {
        ResolvedRuntimeOptions options = resolve(runtimeOptions);
        OpenAIClient openAiClient = buildClient(options);
        return OpenAiChatModel.builder()
                .openAiClient(openAiClient)
                .options(OpenAiChatOptions.builder()
                        .baseUrl(options.baseUrl())
                        .apiKey(options.apiKey())
                        .model(options.model())
                        .timeout(options.requestTimeout())
                        .build())
                .build();
    }

    public OpenAiEmbeddingModel createEmbeddingModel(SpringAiRuntimeOptions runtimeOptions) {
        ResolvedRuntimeOptions options = resolve(runtimeOptions);
        OpenAIClient openAiClient = buildClient(options);
        return OpenAiEmbeddingModel.builder()
                .openAiClient(openAiClient)
                .options(OpenAiEmbeddingOptions.builder()
                        .baseUrl(options.baseUrl())
                        .apiKey(options.apiKey())
                        .model(options.model())
                        .timeout(options.requestTimeout())
                        .build())
                .build();
    }

    public OpenAiImageModel createImageModel(SpringAiRuntimeOptions runtimeOptions) {
        ResolvedRuntimeOptions options = resolve(runtimeOptions);
        OpenAIClient openAiClient = buildClient(options);
        return OpenAiImageModel.builder()
                .openAiClient(openAiClient)
                .options(OpenAiImageOptions.builder()
                        .baseUrl(options.baseUrl())
                        .apiKey(options.apiKey())
                        .model(options.model())
                        .timeout(options.requestTimeout())
                        .build())
                .build();
    }

    private OpenAIClient buildClient(ResolvedRuntimeOptions options) {
        Timeout timeout = Timeout.builder()
                .connect(options.connectTimeout())
                .read(options.readTimeout())
                .write(options.readTimeout())
                .request(options.requestTimeout())
                .build();
        SpringAiOpenAiHttpClient httpClient = SpringAiOpenAiHttpClient.builder()
                .timeout(timeout)
                .build();
        ClientOptions clientOptions = ClientOptions.builder()
                .baseUrl(options.baseUrl())
                .apiKey(options.apiKey())
                .timeout(timeout)
                .httpClient(httpClient)
                .build();
        return new OpenAIClientImpl(clientOptions);
    }

    private ResolvedRuntimeOptions resolve(SpringAiRuntimeOptions runtimeOptions) {
        if (runtimeOptions == null) {
            throw new IllegalArgumentException("Spring AI runtime options are required");
        }
        String baseUrl = requireNonBlank(runtimeOptions.baseUrl(), "Spring AI base URL is required");
        String apiKey = requireNonBlank(runtimeOptions.apiKey(), "Spring AI API key is required");
        String model = requireNonBlank(runtimeOptions.model(), "Spring AI model is required");
        long connectTimeoutMillis = positiveTimeoutOrDefault(runtimeOptions.connectTimeoutMillis(), DEFAULT_CONNECT_TIMEOUT_MILLIS,
                "Spring AI connect timeout must be positive");
        long readTimeoutMillis = positiveTimeoutOrDefault(runtimeOptions.readTimeoutMillis(), DEFAULT_READ_TIMEOUT_MILLIS,
                "Spring AI read timeout must be positive");
        Duration connectTimeout = Duration.ofMillis(connectTimeoutMillis);
        Duration readTimeout = Duration.ofMillis(readTimeoutMillis);
        return new ResolvedRuntimeOptions(
                normalizeBaseUrl(baseUrl),
                apiKey.trim(),
                model.trim(),
                connectTimeout,
                readTimeout,
                connectTimeout.plus(readTimeout)
        );
    }

    private static String normalizeBaseUrl(String rawBaseUrl) {
        String trimmed = rawBaseUrl.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    private static String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value;
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

    private record ResolvedRuntimeOptions(
            String baseUrl,
            String apiKey,
            String model,
            Duration connectTimeout,
            Duration readTimeout,
            Duration requestTimeout
    ) {
    }
}
