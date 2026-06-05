package com.sreehc.aiagent.application.knowledge;

import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.infrastructure.knowledge.EmbeddingProviderException;
import com.sreehc.aiagent.infrastructure.knowledge.EmbeddingProviderRouter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class QueryEmbeddingService {
    private final EmbeddingProviderRouter embeddingProviderRouter;

    public QueryEmbeddingService(EmbeddingProviderRouter embeddingProviderRouter) {
        this.embeddingProviderRouter = embeddingProviderRouter;
    }

    public String embed(String query) {
        try {
            return embeddingProviderRouter.embed(query);
        } catch (EmbeddingProviderException exception) {
            throw new AppException("EMBEDDING_PROVIDER_FAILED", exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }
}
