package com.sreehc.aiagent.domain.account;

import java.time.Instant;

public record InviteRegistration(
        long id,
        String inviteToken,
        String status,
        Instant expiresAt
) {
    public boolean isAvailableAt(Instant now) {
        return "NEW".equals(status) && expiresAt.isAfter(now);
    }
}

