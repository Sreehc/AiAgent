package com.sreehc.aiagent.domain.session;

import java.time.Instant;

public record ArtifactRecord(
        long id,
        String artifactCode,
        long sessionId,
        long runId,
        ArtifactType artifactType,
        String title,
        String content,
        Instant createdAt
) {
}
