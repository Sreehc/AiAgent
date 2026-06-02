package com.sreehc.aiagent.domain.mcp;

import java.time.Instant;

public record McpServerConfig(
        long id,
        String serverCode,
        String name,
        McpTransportType transportType,
        String endpoint,
        String commandLine,
        McpServerStatus status,
        long createdBy,
        Instant createdAt,
        Instant updatedAt
) {
}
