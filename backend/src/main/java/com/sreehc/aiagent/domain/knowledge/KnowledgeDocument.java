package com.sreehc.aiagent.domain.knowledge;

import java.time.Instant;

public record KnowledgeDocument(
        long id,
        long knowledgeBaseId,
        String documentId,
        String fileName,
        String fileType,
        String storageUri,
        DocumentParseStatus parseStatus,
        String textContent,
        Instant createdAt,
        Instant updatedAt,
        int chunkCount
) {
}
