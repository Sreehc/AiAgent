package com.sreehc.aiagent.application.mcp;

import com.sreehc.aiagent.application.common.AdminAuthorizationService;
import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpServerStatus;
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
        validateTransportConfig(command.transportType(), command.endpoint(), command.commandLine());
        long id = mcpServerRepository.createServer(
                command.serverCode(),
                command.name(),
                command.transportType(),
                normalizeOptional(command.endpoint()),
                normalizeOptional(command.commandLine()),
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
        validateTransportConfig(command.transportType(), command.endpoint(), command.commandLine());
        loadServer(serverCode);
        mcpServerRepository.updateServer(
                serverCode,
                command.name(),
                command.transportType(),
                normalizeOptional(command.endpoint()),
                normalizeOptional(command.commandLine()),
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
        String healthState = resolveHealthState(server, health);
        String riskReason = resolveHealthRiskReason(server, health, healthState);
        return new HealthResult(server.serverCode(), health.status(), healthState, riskReason, health.message(), health.latencyMs(), health.toolCount(), health.transportType(), health.errorCode(), health.checkedAt());
    }

    public ToolTestResult testTool(SessionUser currentUser, String serverCode, String toolName, String input) {
        adminAuthorizationService.ensureAdmin(currentUser);
        McpServerConfig server = loadServer(serverCode);
        McpToolDescriptor tool = mcpRuntimeGateway.discoverTools(server).stream()
                .filter(item -> item.toolName().equals(toolName))
                .findFirst()
                .orElseThrow(() -> new AppException("MCP_TOOL_NOT_FOUND", "MCP tool not found", HttpStatus.NOT_FOUND));
        McpRuntimeGateway.ToolExecutionResult result = mcpRuntimeGateway.invoke(server, tool, "Manual admin tool test", input == null ? "" : input);
        return new ToolTestResult(server.serverCode(), tool.toolName(), result.resultText(), result.responsePayload());
    }

    private McpServerConfig loadServer(String serverCode) {
        return mcpServerRepository.findByServerCode(serverCode)
                .orElseThrow(() -> new AppException("MCP_SERVER_NOT_FOUND", "MCP server not found", HttpStatus.NOT_FOUND));
    }

    private void validateTransportConfig(McpTransportType transportType, String endpoint, String commandLine) {
        if (transportType == McpTransportType.STDIO && isBlank(commandLine)) {
            throw new AppException("MCP_COMMAND_REQUIRED", "Command line is required for STDIO transport", HttpStatus.BAD_REQUEST);
        }
        if (transportType != McpTransportType.STDIO && isBlank(endpoint)) {
            throw new AppException("MCP_ENDPOINT_REQUIRED", "Endpoint is required for HTTP transports", HttpStatus.BAD_REQUEST);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String normalizeOptional(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private String resolveHealthState(McpServerConfig server, McpRuntimeGateway.HealthCheckResult health) {
        if (server.status() != McpServerStatus.ACTIVE) {
            return "unhealthy";
        }
        String normalizedStatus = health.status() == null ? "" : health.status().toUpperCase();
        return switch (normalizedStatus) {
            case "UP", "ACTIVE", "HEALTHY", "SUCCESS", "OK" -> "healthy";
            case "" -> "unknown";
            default -> "unhealthy";
        };
    }

    private String resolveHealthRiskReason(McpServerConfig server, McpRuntimeGateway.HealthCheckResult health, String healthState) {
        if (server.status() != McpServerStatus.ACTIVE) {
            return "MCP server is not ACTIVE";
        }
        if ("healthy".equals(healthState)) {
            return null;
        }
        if (health.errorCode() != null && !health.errorCode().isBlank()) {
            return health.errorCode();
        }
        return health.message() == null || health.message().isBlank() ? "MCP health check is not healthy" : health.message();
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
            String healthState,
            String riskReason,
            String message,
            Long latencyMs,
            int toolCount,
            String transportType,
            String errorCode,
            String checkedAt
    ) {
    }

    public record ToolTestResult(
            String serverCode,
            String toolName,
            String resultText,
            String responsePayload
    ) {
    }
}
