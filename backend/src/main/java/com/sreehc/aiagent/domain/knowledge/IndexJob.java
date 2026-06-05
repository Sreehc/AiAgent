package com.sreehc.aiagent.domain.knowledge;

import java.time.Instant;

public record IndexJob(
        long id,
        String jobId,
        long knowledgeDocumentId,
        IndexJobStatus status,
        String triggerType,
        int retryCount,
        int maxRetryCount,
        String payloadJson,
        String errorMessage,
        Instant createdAt,
        Instant updatedAt,
        Instant startedAt,
        Instant completedAt
) {
}
