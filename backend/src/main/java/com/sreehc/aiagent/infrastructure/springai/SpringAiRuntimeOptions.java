package com.sreehc.aiagent.infrastructure.springai;

public record SpringAiRuntimeOptions(
        String baseUrl,
        String apiKey,
        String model,
        Long connectTimeoutMillis,
        Long readTimeoutMillis,
        Integer retryMaxAttempts,
        Long retryBackoffMillis,
        Boolean observationEnabled
) {
}
