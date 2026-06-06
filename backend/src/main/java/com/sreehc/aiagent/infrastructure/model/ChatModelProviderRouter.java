package com.sreehc.aiagent.infrastructure.model;

import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ChatModelProviderRouter {
    private final List<ChatModelProvider> providers;

    public ChatModelProviderRouter(List<ChatModelProvider> providers) {
        this.providers = providers;
    }

    public ChatModelProvider route(String providerCode) {
        return providers.stream()
                .filter(provider -> provider.providerCode().equalsIgnoreCase(providerCode))
                .findFirst()
                .orElseThrow(() -> new ModelProviderException("Unsupported chat provider: " + providerCode));
    }
}
