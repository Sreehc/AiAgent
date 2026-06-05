package com.sreehc.aiagent.infrastructure.knowledge;

import com.sreehc.aiagent.app.AppProperties;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class EmbeddingProviderRouter {
    private final EmbeddingProvider activeProvider;

    public EmbeddingProviderRouter(List<EmbeddingProvider> providers, AppProperties appProperties) {
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

    private String resolveConfiguredProvider(AppProperties appProperties) {
        if (appProperties.embedding() == null || appProperties.embedding().provider() == null) {
            return "local-mock";
        }
        return appProperties.embedding().provider().trim().toLowerCase(Locale.ROOT);
    }
}
