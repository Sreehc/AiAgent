package com.sreehc.aiagent.domain.account;

import java.time.Instant;

public record LoginLogEntry(
        String loginIp,
        String userAgent,
        String loginResult,
        Instant loginAt
) {
}

