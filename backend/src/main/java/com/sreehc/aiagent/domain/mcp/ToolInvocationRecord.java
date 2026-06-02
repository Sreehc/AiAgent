package com.sreehc.aiagent.domain.mcp;

import java.time.Instant;

public record ToolInvocationRecord(
        long id,
        long executionRunId,
        String toolCallId,
        String toolName,
        String toolType,
        String requestPayload,
        String responsePayload,
        ToolInvocationStatus status,
        Instant startedAt,
        Instant endedAt
) {
}
