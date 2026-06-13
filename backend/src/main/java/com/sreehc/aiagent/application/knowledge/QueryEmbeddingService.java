package com.sreehc.aiagent.application.knowledge;

import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.application.admin.ModelRuntimeResolver;
import com.sreehc.aiagent.domain.admin.ModelType;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.infrastructure.knowledge.EmbeddingProviderException;
import com.sreehc.aiagent.infrastructure.knowledge.EmbeddingProviderRouter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class QueryEmbeddingService {
    private final EmbeddingProviderRouter embeddingProviderRouter;
    private final RagCacheService ragCacheService;
    private final ModelRuntimeResolver modelRuntimeResolver;

    public QueryEmbeddingService(EmbeddingProviderRouter embeddingProviderRouter, RagCacheService ragCacheService, ModelRuntimeResolver modelRuntimeResolver) {
        this.embeddingProviderRouter = embeddingProviderRouter;
        this.ragCacheService = ragCacheService;
        this.modelRuntimeResolver = modelRuntimeResolver;
    }

    public String embed(String query) {
        return ragCacheService.getEmbedding(embeddingProviderRouter.providerCode(), query)
                .orElseGet(() -> embedAndCache(query));
    }

    public String embedForUser(SessionUser currentUser, String query) {
        return modelRuntimeResolver.findForUser(currentUser, ModelType.EMBEDDING, null)
                .map(runtimeModel -> {
                    String cacheProviderKey = runtimeModel.provider() + ":" + runtimeModel.modelCode() + ":" + runtimeModel.baseUrl();
                    return ragCacheService.getEmbedding(cacheProviderKey, query)
                            .orElseGet(() -> embedAndCache(query, runtimeModel, cacheProviderKey));
                })
                .orElseGet(() -> embed(query));
    }

    private String embedAndCache(String query) {
        try {
            String embedding = embeddingProviderRouter.embed(query);
            ragCacheService.putEmbedding(embeddingProviderRouter.providerCode(), query, embedding);
            return embedding;
        } catch (EmbeddingProviderException exception) {
            throw new AppException("EMBEDDING_PROVIDER_FAILED", exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private String embedAndCache(String query, ModelRuntimeResolver.RuntimeModel runtimeModel, String cacheProviderKey) {
        try {
            String embedding = embeddingProviderRouter.embed(runtimeModel.provider(), query, runtimeModel.modelCode(), runtimeModel.baseUrl(), runtimeModel.apiKey());
            ragCacheService.putEmbedding(cacheProviderKey, query, embedding);
            return embedding;
        } catch (EmbeddingProviderException exception) {
            throw new AppException("EMBEDDING_PROVIDER_FAILED", exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }
}
