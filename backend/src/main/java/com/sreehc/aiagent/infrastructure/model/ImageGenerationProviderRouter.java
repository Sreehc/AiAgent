package com.sreehc.aiagent.infrastructure.model;

import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ImageGenerationProviderRouter {
    private final List<ImageGenerationProvider> providers;

    public ImageGenerationProviderRouter(List<ImageGenerationProvider> providers) {
        this.providers = providers;
    }

    public ImageGenerationProvider route(String providerCode) {
        return providers.stream()
                .filter(provider -> provider.providerCode().equalsIgnoreCase(providerCode))
                .findFirst()
                .orElseThrow(() -> new ModelProviderException("Unsupported image provider: " + providerCode));
    }
}
