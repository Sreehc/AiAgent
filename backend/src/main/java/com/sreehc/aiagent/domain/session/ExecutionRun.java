package com.sreehc.aiagent.domain.session;

import java.time.Instant;
import java.util.List;

public record ExecutionRun(
        long id,
        String runCode,
        long sessionId,
        long userId,
        String queryText,
        AgentMode executionMode,
        List<String> knowledgeBaseIds,
        RunStatus status,
        String errorMessage,
        Instant startedAt,
        Instant completedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
