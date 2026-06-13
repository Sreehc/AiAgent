package com.sreehc.aiagent.application.mcp;

import com.sreehc.aiagent.application.common.AdminAuthorizationService;
import com.sreehc.aiagent.application.common.AppException;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class McpAdminServiceTest {
    private McpServerRepository repository;
    private McpAdminService service;
    private SessionUser admin;

    @BeforeEach
    void setUp() {
        repository = mock(McpServerRepository.class);
        service = new McpAdminService(
                mock(AdminAuthorizationService.class),
                repository,
                mock(McpRuntimeGateway.class)
        );
        admin = new SessionUser(1L, "admin", "Admin", List.of(UserRole.ADMIN));
    }

    @Test
    void shouldRequireCommandForStdioTransport() {
        AppException exception = assertThrows(AppException.class, () -> service.createServer(
                admin,
                new McpAdminService.CreateServerCommand("local", "local", McpTransportType.STDIO, null, " ")
        ));

        assertEquals("MCP_COMMAND_REQUIRED", exception.code());
    }

    @Test
    void shouldRequireEndpointForHttpTransport() {
        AppException exception = assertThrows(AppException.class, () -> service.createServer(
                admin,
                new McpAdminService.CreateServerCommand("remote", "remote", McpTransportType.SSE, " ", null)
        ));

        assertEquals("MCP_ENDPOINT_REQUIRED", exception.code());
    }

    @Test
    void shouldAllowStdioWithoutEndpointAndNormalizeOptionalValues() {
        when(repository.createServer("local", "local", McpTransportType.STDIO, null, "node server.js", 1L)).thenReturn(5L);
        when(repository.findById(5L)).thenReturn(Optional.of(config()));

        service.createServer(
                admin,
                new McpAdminService.CreateServerCommand("local", "local", McpTransportType.STDIO, " ", " node server.js ")
        );

        verify(repository).createServer("local", "local", McpTransportType.STDIO, null, "node server.js", 1L);
    }

    private McpServerConfig config() {
        Instant now = Instant.now();
        return new McpServerConfig(
                5L, "local", "local", McpTransportType.STDIO, null, "node server.js",
                McpServerStatus.ACTIVE, 1L, now, now
        );
    }
}
