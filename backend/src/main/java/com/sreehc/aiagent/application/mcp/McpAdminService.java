package com.sreehc.aiagent.application.mcp;

import com.sreehc.aiagent.application.common.AdminAuthorizationService;
import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpToolDescriptor;
import com.sreehc.aiagent.domain.mcp.McpTransportType;
import com.sreehc.aiagent.infrastructure.mcp.McpRuntimeGateway;
import com.sreehc.aiagent.infrastructure.mcp.McpServerRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class McpAdminService {
    private final AdminAuthorizationService adminAuthorizationService;
    private final McpServerRepository mcpServerRepository;
    private final McpRuntimeGateway mcpRuntimeGateway;

    public McpAdminService(
            AdminAuthorizationService adminAuthorizationService,
            McpServerRepository mcpServerRepository,
            McpRuntimeGateway mcpRuntimeGateway
    ) {
        this.adminAuthorizationService = adminAuthorizationService;
        this.mcpServerRepository = mcpServerRepository;
        this.mcpRuntimeGateway = mcpRuntimeGateway;
    }

    @Transactional
    public McpServerConfig createServer(SessionUser currentUser, CreateServerCommand command) {
        adminAuthorizationService.ensureAdmin(currentUser);
        long id = mcpServerRepository.createServer(
                command.serverCode(),
                command.name(),
                command.transportType(),
                command.endpoint(),
                command.commandLine(),
                currentUser.id()
        );
        return mcpServerRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Failed to load created MCP server"));
    }

    public List<McpServerConfig> listServers(SessionUser currentUser) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return mcpServerRepository.listServers();
    }

    @Transactional
    public McpServerConfig updateServer(SessionUser currentUser, String serverCode, UpdateServerCommand command) {
        adminAuthorizationService.ensureAdmin(currentUser);
        loadServer(serverCode);
        mcpServerRepository.updateServer(
                serverCode,
                command.name(),
                command.transportType(),
                command.endpoint(),
                command.commandLine(),
                command.active()
        );
        mcpRuntimeGateway.evict(serverCode);
        return loadServer(serverCode);
    }

    @Transactional
    public void deleteServer(SessionUser currentUser, String serverCode) {
        adminAuthorizationService.ensureAdmin(currentUser);
        loadServer(serverCode);
        mcpServerRepository.deleteServer(serverCode);
        mcpRuntimeGateway.evict(serverCode);
    }

    public DiscoverResult discoverTools(SessionUser currentUser, String serverCode) {
        adminAuthorizationService.ensureAdmin(currentUser);
        McpServerConfig server = loadServer(serverCode);
        List<McpToolDescriptor> tools = mcpRuntimeGateway.discoverTools(server);
        return new DiscoverResult(server.serverCode(), tools, mcpRuntimeGateway.isCached(server.serverCode()));
    }

    public HealthResult health(SessionUser currentUser, String serverCode) {
        adminAuthorizationService.ensureAdmin(currentUser);
        McpServerConfig server = loadServer(serverCode);
        McpRuntimeGateway.HealthCheckResult health = mcpRuntimeGateway.health(server);
        return new HealthResult(server.serverCode(), health.status(), health.message());
    }

    private McpServerConfig loadServer(String serverCode) {
        return mcpServerRepository.findByServerCode(serverCode)
                .orElseThrow(() -> new AppException("MCP_SERVER_NOT_FOUND", "MCP server not found", HttpStatus.NOT_FOUND));
    }

    public record CreateServerCommand(
            String name,
            String serverCode,
            McpTransportType transportType,
            String endpoint,
            String commandLine
    ) {
    }

    public record UpdateServerCommand(
            String name,
            McpTransportType transportType,
            String endpoint,
            String commandLine,
            boolean active
    ) {
    }

    public record DiscoverResult(
            String serverCode,
            List<McpToolDescriptor> tools,
            boolean cached
    ) {
    }

    public record HealthResult(
            String serverCode,
            String status,
            String message
    ) {
    }
}
