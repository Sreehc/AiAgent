package com.sreehc.aiagent.domain.session;

import java.time.Instant;

public record AgentSession(
        long id,
        String sessionCode,
        long userId,
        String title,
        AgentMode agentMode,
        SessionStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
