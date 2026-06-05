package com.sreehc.aiagent.application.knowledge;

import com.sreehc.aiagent.domain.knowledge.DocumentParseStatus;
import com.sreehc.aiagent.domain.knowledge.KnowledgeDocument;
import com.sreehc.aiagent.infrastructure.knowledge.EmbeddingProviderException;
import com.sreehc.aiagent.infrastructure.knowledge.EmbeddingProviderRouter;
import com.sreehc.aiagent.infrastructure.knowledge.KnowledgeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KnowledgeIndexExecutionService {
    private final KnowledgeRepository knowledgeRepository;
    private final EmbeddingProviderRouter embeddingProviderRouter;
    private final DocumentChunker documentChunker;

    public KnowledgeIndexExecutionService(
            KnowledgeRepository knowledgeRepository,
            EmbeddingProviderRouter embeddingProviderRouter,
            DocumentChunker documentChunker
    ) {
        this.knowledgeRepository = knowledgeRepository;
        this.embeddingProviderRouter = embeddingProviderRouter;
        this.documentChunker = documentChunker;
    }

    @Transactional
    public void execute(KnowledgeDocument document) {
        knowledgeRepository.deleteChunksByDocument(document.id());
        int chunkNo = 1;
        for (ChunkSegment chunk : documentChunker.chunk(document.fileName(), document.fileType(), document.textContent())) {
            knowledgeRepository.createChunk(
                    document.id(),
                    nextCode("chunk"),
                    chunkNo,
                    chunk.contentPreview(),
                    chunk.contentText(),
                    embeddingProviderRouter.embed(chunk.contentText()),
                    chunk.sectionTitle(),
                    chunk.headingPath(),
                    chunk.tokenCount(),
                    chunk.metadataJson()
            );
            chunkNo += 1;
        }
        knowledgeRepository.markDocumentIndexed(document.id());
    }

    public boolean isRetryable(Exception exception) {
        return exception instanceof EmbeddingProviderException;
    }

    private String nextCode(String prefix) {
        return prefix + "_" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
