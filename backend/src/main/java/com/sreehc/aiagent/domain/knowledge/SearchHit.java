package com.sreehc.aiagent.domain.knowledge;

public record SearchHit(
        String kbId,
        String documentId,
        String fileName,
        String chunkId,
        int chunkNo,
        String contentPreview,
        double score
) {
}
