package com.sreehc.aiagent.domain.knowledge;

public record SearchHit(
        String kbId,
        String documentId,
        String fileName,
        String chunkId,
        String citationId,
        int chunkNo,
        int sourceOffset,
        int rank,
        String contentPreview,
        String contentText,
        String sectionTitle,
        String headingPath,
        int tokenCount,
        String retrievalStrategy,
        double score
) {
}
