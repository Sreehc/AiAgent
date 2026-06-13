package com.sreehc.aiagent.domain.admin;

import java.time.Instant;

public record ModelConfig(
        long id,
        String modelCode,
        String name,
        String provider,
        ModelType modelType,
        String baseUrl,
        String apiKeyMasked,
        boolean enabled,
        boolean defaultModel,
        String lastTestStatus,
        String lastTestMessage,
        Instant lastTestedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
