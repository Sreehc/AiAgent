package com.sreehc.aiagent.domain.session;

import java.time.Instant;
import java.util.List;

public record ExecutionRun(
        long id,
        String runCode,
        long sessionId,
        long userId,
        String queryText,
        String retrievalQuery,
        AgentMode executionMode,
        List<String> knowledgeBaseIds,
        RunStatus status,
        String errorMessage,
        String recallSetJson,
        String finalEvidenceSetJson,
        Instant startedAt,
        Instant completedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
