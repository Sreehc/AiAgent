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
        Instant createdAt,
        Instant updatedAt
) {
}
