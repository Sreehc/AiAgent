package com.sreehc.aiagent.trigger.admin;

import com.sreehc.aiagent.application.mcp.McpAdminService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpToolDescriptor;
import com.sreehc.aiagent.domain.mcp.McpTransportType;
import com.sreehc.aiagent.trigger.ApiResponse;
import com.sreehc.aiagent.trigger.AuthFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1/admin/mcp-servers")
public class McpAdminController {
    private final McpAdminService mcpAdminService;

    public McpAdminController(McpAdminService mcpAdminService) {
        this.mcpAdminService = mcpAdminService;
    }

    @GetMapping
    public ApiResponse<List<McpServerResponse>> listServers(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser
    ) {
        return ApiResponse.success(mcpAdminService.listServers(currentUser).stream()
                .map(this::toResponse)
                .toList());
    }

    @PostMapping
    public ApiResponse<McpServerResponse> createServer(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @Valid @RequestBody CreateMcpServerRequest request
    ) {
        return ApiResponse.success(toResponse(mcpAdminService.createServer(currentUser, new McpAdminService.CreateServerCommand(
                request.name(),
                request.serverCode(),
                request.transportType(),
                request.endpoint(),
                request.commandLine()
        ))));
    }

    @PutMapping("/{serverCode}")
    public ApiResponse<McpServerResponse> updateServer(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String serverCode,
            @Valid @RequestBody UpdateMcpServerRequest request
    ) {
        return ApiResponse.success(toResponse(mcpAdminService.updateServer(currentUser, serverCode, new McpAdminService.UpdateServerCommand(
                request.name(),
                request.transportType(),
                request.endpoint(),
                request.commandLine(),
                request.active()
        ))));
    }

    @DeleteMapping("/{serverCode}")
    public ApiResponse<Void> deleteServer(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String serverCode
    ) {
        mcpAdminService.deleteServer(currentUser, serverCode);
        return ApiResponse.success(null);
    }

    @PostMapping("/{serverCode}/discover")
    public ApiResponse<DiscoverResponse> discover(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String serverCode
    ) {
        McpAdminService.DiscoverResult result = mcpAdminService.discoverTools(currentUser, serverCode);
        return ApiResponse.success(new DiscoverResponse(
                result.serverCode(),
                result.tools().stream().map(tool -> new ToolDescriptorResponse(
                        tool.toolName(),
                        tool.toolType(),
                        tool.description()
                )).toList(),
                result.cached()
        ));
    }

    @GetMapping("/{serverCode}/health")
    public ApiResponse<HealthResponse> health(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String serverCode
    ) {
        McpAdminService.HealthResult result = mcpAdminService.health(currentUser, serverCode);
        return ApiResponse.success(new HealthResponse(result.serverCode(), result.status(), result.message()));
    }

    private McpServerResponse toResponse(McpServerConfig config) {
        return new McpServerResponse(
                config.serverCode(),
                config.name(),
                config.transportType().name(),
                config.endpoint(),
                config.commandLine(),
                config.status().name(),
                config.createdAt().toString(),
                config.updatedAt().toString()
        );
    }

    public record CreateMcpServerRequest(
            @NotBlank @Size(max = 128) String name,
            @NotBlank @Size(max = 64) String serverCode,
            @NotNull McpTransportType transportType,
            @NotBlank @Size(max = 512) String endpoint,
            @Size(max = 512) String commandLine
    ) {
    }

    public record UpdateMcpServerRequest(
            @NotBlank @Size(max = 128) String name,
            @NotNull McpTransportType transportType,
            @NotBlank @Size(max = 512) String endpoint,
            @Size(max = 512) String commandLine,
            boolean active
    ) {
    }

    public record McpServerResponse(
            String serverCode,
            String name,
            String transportType,
            String endpoint,
            String commandLine,
            String status,
            String createdAt,
            String updatedAt
    ) {
    }

    public record ToolDescriptorResponse(
            String toolName,
            String toolType,
            String description
    ) {
    }

    public record DiscoverResponse(
            String serverCode,
            List<ToolDescriptorResponse> tools,
            boolean cached
    ) {
    }

    public record HealthResponse(
            String serverCode,
            String status,
            String message
    ) {
    }
}
