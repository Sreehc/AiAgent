package com.sreehc.aiagent.domain.admin;

import java.time.Instant;

public record AdminInvite(
        String inviteToken,
        String status,
        Instant expiresAt,
        Instant createdAt
) {
}
