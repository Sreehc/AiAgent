package com.sreehc.aiagent.infrastructure.mcp;

import com.sreehc.aiagent.app.AppProperties;
import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpToolDescriptor;
import com.sreehc.aiagent.domain.mcp.McpTransportType;
import java.net.InetAddress;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class McpRuntimeGateway {
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);

    private final AppProperties appProperties;
    private final List<McpTransportClient> transportClients;
    private final Map<String, CachedToolSet> cache = new ConcurrentHashMap<>();

    public McpRuntimeGateway(AppProperties appProperties, List<McpTransportClient> transportClients) {
        this.appProperties = appProperties;
        this.transportClients = transportClients;
    }

    public List<McpToolDescriptor> discoverTools(McpServerConfig server) {
        CachedToolSet cached = cache.get(server.serverCode());
        if (cached != null && cached.expiresAt().isAfter(Instant.now())) {
            return cached.tools();
        }
        McpTransportClient client = resolveClient(server);
        List<McpToolDescriptor> discovered = client.discoverTools(server);
        cache.put(server.serverCode(), new CachedToolSet(discovered, Instant.now().plus(CACHE_TTL)));
        return discovered;
    }

    public boolean isCached(String serverCode) {
        CachedToolSet cached = cache.get(serverCode);
        return cached != null && cached.expiresAt().isAfter(Instant.now());
    }

    public void evict(String serverCode) {
        cache.remove(serverCode);
    }

    public HealthCheckResult health(McpServerConfig server) {
        try {
            validateServer(server);
            Instant startedAt = Instant.now();
            List<McpToolDescriptor> tools = resolveClient(server).discoverTools(server);
            long latencyMs = Duration.between(startedAt, Instant.now()).toMillis();
            return new HealthCheckResult("UP", "Discovered " + tools.size() + " tools in " + latencyMs + "ms", latencyMs, tools.size(), server.transportType().name(), null, Instant.now().toString());
        } catch (Exception exception) {
            return new HealthCheckResult("DOWN", exception.getMessage(), null, 0, server.transportType().name(), exception.getClass().getSimpleName(), Instant.now().toString());
        }
    }

    public ToolExecutionResult invoke(
            McpServerConfig server,
            McpToolDescriptor tool,
            String stepTitle,
            String input
    ) {
        validateServer(server);
        return resolveClient(server).invoke(server, tool, stepTitle, input);
    }

    public McpToolDescriptor pickToolForStep(List<McpToolDescriptor> tools, String stepToolName) {
        String desiredType = switch (stepToolName) {
            case "market-scanner" -> "SEARCH";
            case "knowledge-search" -> "RETRIEVAL";
            case "competitor-analyzer" -> "ANALYSIS";
            case "report-writer" -> "SYNTHESIS";
            default -> "GENERIC";
        };

        return pickByDesiredType(tools, desiredType);
    }

    private McpToolDescriptor pickByDesiredType(List<McpToolDescriptor> tools, String desiredType) {
        return tools.stream()
                .filter(tool -> desiredType.equals(tool.toolType()))
                .findFirst()
                .orElseGet(() -> tools.isEmpty() ? null : tools.get(0));
    }

    private URI validateHttpEndpoint(String endpoint) throws Exception {
        if (endpoint == null || endpoint.isBlank()) {
            throw new IllegalArgumentException("endpoint is required");
        }
        URI uri = URI.create(endpoint);
        if (!"http".equalsIgnoreCase(uri.getScheme()) && !"https".equalsIgnoreCase(uri.getScheme())) {
            throw new IllegalArgumentException("Only HTTP(S) MCP endpoints are allowed");
        }
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("MCP endpoint host is required");
        }
        if (!isAllowedHost(host)) {
            throw new IllegalArgumentException("MCP endpoint host is not allowlisted");
        }
        for (InetAddress address : InetAddress.getAllByName(host)) {
            if (isBlockedAddress(address)) {
                throw new IllegalArgumentException("MCP endpoint resolves to a blocked network address");
            }
        }
        return uri;
    }

    private McpTransportClient resolveClient(McpServerConfig server) {
        return transportClients.stream()
                .filter(client -> client.supports(server))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Unsupported MCP transport: " + server.transportType()));
    }

    private void validateServer(McpServerConfig server) {
        if (server.transportType() == com.sreehc.aiagent.domain.mcp.McpTransportType.STDIO) {
            String executable = server.commandLine() == null ? null : server.commandLine().trim().split("\\s+")[0];
            if (!isAllowedStdioExecutable(executable)) {
                throw new IllegalArgumentException("STDIO executable is not allowlisted");
            }
            return;
        }
        try {
            validateHttpEndpoint(server.endpoint());
        } catch (Exception exception) {
            throw new IllegalArgumentException(exception.getMessage(), exception);
        }
    }

    private boolean isAllowedHost(String host) {
        String allowedHosts = appProperties.mcp() == null ? null : appProperties.mcp().allowedHosts();
        if (allowedHosts == null || allowedHosts.isBlank()) {
            return false;
        }
        return Arrays.stream(allowedHosts.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .anyMatch(allowed -> "*".equals(allowed) || host.equalsIgnoreCase(allowed) || host.endsWith("." + allowed));
    }

    private boolean isBlockedAddress(InetAddress address) {
        if (Boolean.TRUE.equals(appProperties.mcp() == null ? null : appProperties.mcp().allowPrivateNetwork())) {
            return false;
        }
        return address.isAnyLocalAddress()
                || address.isLoopbackAddress()
                || address.isLinkLocalAddress()
                || address.isSiteLocalAddress()
                || address.isMulticastAddress()
                || "169.254.169.254".equals(address.getHostAddress());
    }

    private boolean isAllowedStdioExecutable(String executable) {
        if (executable == null || executable.isBlank() || executable.contains("/") || executable.contains("\\")) {
            return false;
        }
        String allowed = appProperties.mcp() == null ? null : appProperties.mcp().allowedStdioExecutables();
        if (allowed == null || allowed.isBlank()) {
            return false;
        }
        boolean allowlisted = Arrays.stream(allowed.split(","))
                .map(String::trim)
                .anyMatch(executable::equals);
        if (!allowlisted) {
            return false;
        }
        String path = System.getenv("PATH");
        if (path == null || path.isBlank()) {
            return false;
        }
        return Arrays.stream(path.split(java.io.File.pathSeparator))
                .map(Path::of)
                .map(directory -> directory.resolve(executable))
                .anyMatch(Files::isExecutable);
    }

    public record ToolExecutionResult(
            String requestPayload,
            String responsePayload,
            String resultText
    ) {
    }

    public record HealthCheckResult(
            String status,
            String message,
            Long latencyMs,
            int toolCount,
            String transportType,
            String errorCode,
            String checkedAt
    ) {
    }

    private record CachedToolSet(
            List<McpToolDescriptor> tools,
            Instant expiresAt
    ) {
    }
}
