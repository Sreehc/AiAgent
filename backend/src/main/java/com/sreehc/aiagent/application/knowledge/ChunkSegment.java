package com.sreehc.aiagent.application.knowledge;

public record ChunkSegment(
        String contentText,
        String contentPreview,
        String sectionTitle,
        String headingPath,
        int tokenCount,
        String metadataJson
) {
}
