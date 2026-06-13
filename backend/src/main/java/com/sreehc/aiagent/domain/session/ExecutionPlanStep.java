package com.sreehc.aiagent.domain.session;

import java.time.Instant;

public record ExecutionPlanStep(
        long id,
        String stepCode,
        long runId,
        int stepNo,
        String title,
        PlanStepStatus status,
        String toolName,
        String toolInput,
        String toolOutput,
        int plannerRound,
        String observation,
        String completionJudgement,
        int retryCount,
        Instant startedAt,
        Instant completedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
