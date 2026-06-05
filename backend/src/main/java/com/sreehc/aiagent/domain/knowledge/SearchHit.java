package com.sreehc.aiagent.domain.knowledge;

public record SearchHit(
        String kbId,
        String documentId,
        String fileName,
        String chunkId,
        int chunkNo,
        String contentPreview,
        String contentText,
        String sectionTitle,
        String headingPath,
        int tokenCount,
        String retrievalStrategy,
        double score
) {
}
