package com.sreehc.aiagent.infrastructure.knowledge;

import com.sreehc.aiagent.app.AppProperties;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class EmbeddingProviderRouter {
    private final EmbeddingProvider activeProvider;
    private final List<EmbeddingProvider> providers;

    public EmbeddingProviderRouter(List<EmbeddingProvider> providers, AppProperties appProperties) {
        this.providers = providers;
        String configuredProvider = resolveConfiguredProvider(appProperties);
        this.activeProvider = providers.stream()
                .filter(provider -> provider.providerCode().equalsIgnoreCase(configuredProvider))
                .findFirst()
                .orElseThrow(() -> new EmbeddingProviderException("Unsupported embedding provider: " + configuredProvider));
    }

    public String providerCode() {
        return activeProvider.providerCode();
    }

    public String embed(String content) {
        return activeProvider.embed(content);
    }

    public String embed(String providerCode, String content, String modelCode, String baseUrl, String apiKey) {
        return providers.stream()
                .filter(provider -> provider.providerCode().equalsIgnoreCase(providerCode))
                .findFirst()
                .orElseThrow(() -> new EmbeddingProviderException("Unsupported embedding provider: " + providerCode))
                .embed(content, modelCode, baseUrl, apiKey);
    }

    private String resolveConfiguredProvider(AppProperties appProperties) {
        if (appProperties.embedding() == null || appProperties.embedding().provider() == null) {
            return "local-mock";
        }
        return appProperties.embedding().provider().trim().toLowerCase(Locale.ROOT);
    }
}
