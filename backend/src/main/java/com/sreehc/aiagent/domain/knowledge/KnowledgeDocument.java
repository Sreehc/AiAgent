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
        String contentHash,
        int indexVersion,
        int versionNo,
        long fileSize,
        Instant deletedAt,
        String lastError,
        Instant createdAt,
        Instant updatedAt,
        int chunkCount
) {
    public KnowledgeDocument(
            long id,
            long knowledgeBaseId,
            String documentId,
            String fileName,
            String fileType,
            String storageUri,
            DocumentParseStatus parseStatus,
            String textContent,
            String contentHash,
            int indexVersion,
            String lastError,
            Instant createdAt,
            Instant updatedAt,
            int chunkCount
    ) {
        this(id, knowledgeBaseId, documentId, fileName, fileType, storageUri, parseStatus, textContent,
                contentHash, indexVersion, 1, textContent == null ? 0 : textContent.length(), null,
                lastError, createdAt, updatedAt, chunkCount);
    }
}
