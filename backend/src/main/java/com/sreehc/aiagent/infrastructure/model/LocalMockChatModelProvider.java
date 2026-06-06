package com.sreehc.aiagent.infrastructure.model;

import org.springframework.stereotype.Component;

@Component
public class LocalMockChatModelProvider implements ChatModelProvider {
    @Override
    public String providerCode() {
        return "local-mock";
    }

    @Override
    public ChatCompletion complete(ChatRequest request) {
        String prompt = request.prompt() == null ? "" : request.prompt().trim();
        String text = prompt.length() > 600 ? prompt.substring(0, 600) : prompt;
        return new ChatCompletion("[local-mock chat] " + text);
    }
}
