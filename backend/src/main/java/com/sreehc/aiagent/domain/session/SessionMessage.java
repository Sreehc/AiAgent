package com.sreehc.aiagent.domain.session;

import java.time.Instant;

public record SessionMessage(
        long id,
        String messageCode,
        long sessionId,
        Long runId,
        String roleCode,
        String content,
        Instant createdAt
) {
}
