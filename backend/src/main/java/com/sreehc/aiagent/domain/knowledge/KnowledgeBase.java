package com.sreehc.aiagent.domain.knowledge;

import java.time.Instant;

public record KnowledgeBase(
        long id,
        String kbId,
        long userId,
        String name,
        String description,
        KnowledgeBaseStatus status,
        Instant createdAt,
        Instant updatedAt,
        int documentCount
) {
}
