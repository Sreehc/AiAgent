package com.sreehc.aiagent.application.mcp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sreehc.aiagent.application.common.AdminAuthorizationService;
import com.sreehc.aiagent.domain.account.UserRole;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpServerStatus;
import com.sreehc.aiagent.domain.mcp.McpTransportType;
import com.sreehc.aiagent.infrastructure.mcp.McpRuntimeGateway;
import com.sreehc.aiagent.infrastructure.mcp.McpServerRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class McpAdminServiceTest {
    private static final SessionUser ADMIN = new SessionUser(1L, "admin", "Admin", List.of(UserRole.ADMIN));

    private final AdminAuthorizationService adminAuthorizationService = mock(AdminAuthorizationService.class);
    private final McpServerRepository mcpServerRepository = mock(McpServerRepository.class);
    private final McpRuntimeGateway mcpRuntimeGateway = mock(McpRuntimeGateway.class);
    private final McpAdminService service = new McpAdminService(adminAuthorizationService, mcpServerRepository, mcpRuntimeGateway);

    @Test
    void healthMarksUpResponseAsHealthy() {
        McpServerConfig server = server(McpServerStatus.ACTIVE);
        when(mcpServerRepository.findByServerCode("browser-tools")).thenReturn(Optional.of(server));
        when(mcpRuntimeGateway.health(server)).thenReturn(new McpRuntimeGateway.HealthCheckResult(
                "UP",
                "Discovered 3 tools",
                42L,
                3,
                "SSE",
                null,
                "2026-06-21T00:00:00Z"
        ));

        McpAdminService.HealthResult result = service.health(ADMIN, "browser-tools");

        assertThat(result.status()).isEqualTo("UP");
        assertThat(result.healthState()).isEqualTo("healthy");
        assertThat(result.riskReason()).isNull();
    }

    @Test
    void healthMarksInactiveServerAsUnhealthyEvenWhenRuntimeIsUp() {
        McpServerConfig server = server(McpServerStatus.INACTIVE);
        when(mcpServerRepository.findByServerCode("browser-tools")).thenReturn(Optional.of(server));
        when(mcpRuntimeGateway.health(server)).thenReturn(new McpRuntimeGateway.HealthCheckResult(
                "UP",
                "Discovered 3 tools",
                42L,
                3,
                "SSE",
                null,
                "2026-06-21T00:00:00Z"
        ));

        McpAdminService.HealthResult result = service.health(ADMIN, "browser-tools");

        assertThat(result.healthState()).isEqualTo("unhealthy");
        assertThat(result.riskReason()).isEqualTo("MCP server is not ACTIVE");
    }

    private McpServerConfig server(McpServerStatus status) {
        return new McpServerConfig(
                1L,
                "browser-tools",
                "Browser Tools",
                McpTransportType.SSE,
                "http://localhost:9000/sse",
                null,
                status,
                1L,
                Instant.parse("2026-06-21T00:00:00Z"),
                Instant.parse("2026-06-21T00:00:00Z")
        );
    }
}
