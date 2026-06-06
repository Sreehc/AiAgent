package com.sreehc.aiagent.infrastructure.model;

public interface ChatModelProvider {
    String providerCode();

    ChatCompletion complete(ChatRequest request);

    record ChatRequest(
            String prompt,
            String modelCode,
            String baseUrl,
            String apiKey
    ) {
    }

    record ChatCompletion(
            String text
    ) {
    }
}
