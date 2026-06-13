package com.sreehc.aiagent.domain.session;

import java.time.Instant;

public record ArtifactRecord(
        long id,
        String artifactCode,
        long userId,
        Long sessionId,
        Long runId,
        ArtifactType artifactType,
        String title,
        String content,
        String storageUri,
        String mimeType,
        String metadataJson,
        Long sourceArtifactId,
        boolean reusable,
        Instant createdAt
) {
}
