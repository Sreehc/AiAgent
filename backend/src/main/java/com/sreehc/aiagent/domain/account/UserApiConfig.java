package com.sreehc.aiagent.domain.account;

public record UserApiConfig(
        String baseUrl,
        String apiKeyMasked,
        String model,
        double temperature,
        int maxTokens,
        boolean configured
) {
}
