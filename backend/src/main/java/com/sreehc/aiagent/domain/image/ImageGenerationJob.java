package com.sreehc.aiagent.domain.image;

import java.time.Instant;

public record ImageGenerationJob(
        long id,
        String jobId,
        long userId,
        String sessionCode,
        ImageGenerationMode mode,
        String promptText,
        String size,
        String sourceArtifactId,
        String resultArtifactId,
        ImageGenerationStatus status,
        String errorMessage,
        Instant createdAt
) {
}
