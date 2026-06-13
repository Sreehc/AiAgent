package com.sreehc.aiagent.domain.knowledge;

import java.time.Instant;

public record RagEvaluationRun(
        long id,
        String evalId,
        long userId,
        String knowledgeBaseIdsJson,
        String casesJson,
        String metricsJson,
        String status,
        String errorMessage,
        Instant createdAt,
        Instant completedAt
) {
}
