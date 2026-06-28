package com.sreehc.aiagent.infrastructure.springai;

import com.openai.client.OpenAIClient;
import com.openai.client.OpenAIClientImpl;
import com.openai.core.ClientOptions;
import com.openai.core.Timeout;
import java.time.Duration;
import java.util.function.Supplier;
import io.micrometer.observation.ObservationRegistry;
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
    private static final int DEFAULT_RETRY_MAX_ATTEMPTS = 1;
    private static final int MAX_RETRY_MAX_ATTEMPTS = 5;
    private static final long DEFAULT_RETRY_BACKOFF_MILLIS = 250L;

    public OpenAiChatModel createChatModel(SpringAiRuntimeOptions runtimeOptions) {
        ResolvedRuntimeOptions options = resolveRuntimeOptions(runtimeOptions);
        OpenAIClient openAiClient = buildClient(options);
        return OpenAiChatModel.builder()
                .openAiClient(openAiClient)
                .options(OpenAiChatOptions.builder()
                        .baseUrl(options.baseUrl())
                        .apiKey(options.apiKey())
                        .model(options.model())
                        .timeout(options.requestTimeout())
                        .build())
                .observationRegistry(observationRegistry(options))
                .build();
    }

    public OpenAiEmbeddingModel createEmbeddingModel(SpringAiRuntimeOptions runtimeOptions) {
        ResolvedRuntimeOptions options = resolveRuntimeOptions(runtimeOptions);
        OpenAIClient openAiClient = buildClient(options);
        return OpenAiEmbeddingModel.builder()
                .openAiClient(openAiClient)
                .options(OpenAiEmbeddingOptions.builder()
                        .baseUrl(options.baseUrl())
                        .apiKey(options.apiKey())
                        .model(options.model())
                        .timeout(options.requestTimeout())
                        .build())
                .observationRegistry(observationRegistry(options))
                .build();
    }

    public OpenAiImageModel createImageModel(SpringAiRuntimeOptions runtimeOptions) {
        ResolvedRuntimeOptions options = resolveRuntimeOptions(runtimeOptions);
        OpenAIClient openAiClient = buildClient(options);
        return OpenAiImageModel.builder()
                .openAiClient(openAiClient)
                .options(OpenAiImageOptions.builder()
                        .baseUrl(options.baseUrl())
                        .apiKey(options.apiKey())
                        .model(options.model())
                        .timeout(options.requestTimeout())
                        .build())
                .observationRegistry(observationRegistry(options))
                .build();
    }

    public <T> T executeWithRetry(SpringAiRuntimeOptions runtimeOptions, Supplier<T> operation) {
        ResolvedRuntimeOptions options = resolveRuntimeOptions(runtimeOptions);
        RuntimeException last = null;
        for (int attempt = 1; attempt <= options.retryMaxAttempts(); attempt++) {
            try {
                return operation.get();
            } catch (RuntimeException exception) {
                last = exception;
                if (attempt >= options.retryMaxAttempts()) {
                    throw exception;
                }
                sleep(options.retryBackoff());
            }
        }
        throw last == null ? new IllegalStateException("Retry operation failed without exception") : last;
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

    public ResolvedRuntimeOptions resolveRuntimeOptions(SpringAiRuntimeOptions runtimeOptions) {
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
        int retryMaxAttempts = normalizeRetryMaxAttempts(runtimeOptions.retryMaxAttempts());
        long retryBackoffMillis = normalizeRetryBackoffMillis(runtimeOptions.retryBackoffMillis());
        Duration connectTimeout = Duration.ofMillis(connectTimeoutMillis);
        Duration readTimeout = Duration.ofMillis(readTimeoutMillis);
        return new ResolvedRuntimeOptions(
                normalizeBaseUrl(baseUrl),
                apiKey.trim(),
                model.trim(),
                connectTimeout,
                readTimeout,
                connectTimeout.plus(readTimeout),
                retryMaxAttempts,
                Duration.ofMillis(retryBackoffMillis),
                runtimeOptions.observationEnabled() != null && runtimeOptions.observationEnabled()
        );
    }

    private ObservationRegistry observationRegistry(ResolvedRuntimeOptions options) {
        return options.observationEnabled() ? ObservationRegistry.create() : ObservationRegistry.NOOP;
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

    private static int normalizeRetryMaxAttempts(Integer retryMaxAttempts) {
        if (retryMaxAttempts == null || retryMaxAttempts < 1) {
            return DEFAULT_RETRY_MAX_ATTEMPTS;
        }
        return Math.min(retryMaxAttempts, MAX_RETRY_MAX_ATTEMPTS);
    }

    private static long normalizeRetryBackoffMillis(Long retryBackoffMillis) {
        if (retryBackoffMillis == null || retryBackoffMillis <= 0) {
            return DEFAULT_RETRY_BACKOFF_MILLIS;
        }
        return retryBackoffMillis;
    }

    private static void sleep(Duration duration) {
        try {
            Thread.sleep(duration);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Retry backoff interrupted", exception);
        }
    }

    public record ResolvedRuntimeOptions(
            String baseUrl,
            String apiKey,
            String model,
            Duration connectTimeout,
            Duration readTimeout,
            Duration requestTimeout,
            int retryMaxAttempts,
            Duration retryBackoff,
            boolean observationEnabled
    ) {
        public boolean retryEnabled() {
            return retryMaxAttempts > 1;
        }
    }
}
