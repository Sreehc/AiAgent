package com.sreehc.aiagent.application.knowledge;

import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.infrastructure.knowledge.EmbeddingProviderException;
import com.sreehc.aiagent.infrastructure.knowledge.EmbeddingProviderRouter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class QueryEmbeddingService {
    private final EmbeddingProviderRouter embeddingProviderRouter;
    private final RagCacheService ragCacheService;

    public QueryEmbeddingService(EmbeddingProviderRouter embeddingProviderRouter, RagCacheService ragCacheService) {
        this.embeddingProviderRouter = embeddingProviderRouter;
        this.ragCacheService = ragCacheService;
    }

    public String embed(String query) {
        return ragCacheService.getEmbedding(embeddingProviderRouter.providerCode(), query)
                .orElseGet(() -> embedAndCache(query));
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
}
