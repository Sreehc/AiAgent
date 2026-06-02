package com.sreehc.aiagent.infrastructure.mcp;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpToolDescriptor;
import com.sreehc.aiagent.domain.mcp.McpTransportType;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class McpRuntimeGateway {
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();
    private final Map<String, CachedToolSet> cache = new ConcurrentHashMap<>();

    public McpRuntimeGateway(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<McpToolDescriptor> discoverTools(McpServerConfig server) {
        CachedToolSet cached = cache.get(server.serverCode());
        if (cached != null && cached.expiresAt().isAfter(Instant.now())) {
            return cached.tools();
        }
        List<McpToolDescriptor> discovered = synthesizeTools(server);
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
        return switch (server.transportType()) {
            case SSE, STREAMABLE_HTTP -> httpHealth(server.endpoint());
            case STDIO -> stdioHealth(server.commandLine());
        };
    }

    public ToolExecutionResult invoke(
            McpServerConfig server,
            McpToolDescriptor tool,
            String stepTitle,
            String input
    ) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("serverCode", server.serverCode());
        request.put("toolName", tool.toolName());
        request.put("toolType", tool.toolType());
        request.put("stepTitle", stepTitle);
        request.put("input", input);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("serverCode", server.serverCode());
        response.put("toolName", tool.toolName());
        response.put("toolType", tool.toolType());
        response.put("transport", server.transportType().name());
        response.put("result", switch (tool.toolType()) {
            case "SEARCH" -> "通过 " + server.name() + " 返回相关公开资料摘要";
            case "RETRIEVAL" -> "通过 " + server.name() + " 返回知识库证据摘要";
            case "ANALYSIS" -> "通过 " + server.name() + " 返回竞争格局分析提示";
            case "SYNTHESIS" -> "通过 " + server.name() + " 返回报告合成结果";
            default -> "通过 " + server.name() + " 完成工具调用";
        });

        return new ToolExecutionResult(
                toJson(request),
                toJson(response),
                String.valueOf(response.get("result"))
        );
    }

    public McpToolDescriptor pickToolForStep(List<McpToolDescriptor> tools, String stepToolName) {
        String desiredType = switch (stepToolName) {
            case "market-scanner" -> "SEARCH";
            case "knowledge-search" -> "RETRIEVAL";
            case "competitor-analyzer" -> "ANALYSIS";
            case "report-writer" -> "SYNTHESIS";
            default -> "GENERIC";
        };

        return tools.stream()
                .filter(tool -> desiredType.equals(tool.toolType()))
                .findFirst()
                .orElseGet(() -> tools.isEmpty() ? null : tools.get(0));
    }

    private List<McpToolDescriptor> synthesizeTools(McpServerConfig server) {
        List<McpToolDescriptor> tools = new ArrayList<>();
        if (server.transportType() == McpTransportType.STDIO) {
            tools.add(new McpToolDescriptor("local-search", "SEARCH", "Local CLI based search helper"));
            tools.add(new McpToolDescriptor("local-analysis", "ANALYSIS", "Local CLI based analysis helper"));
            tools.add(new McpToolDescriptor("local-report", "SYNTHESIS", "Local CLI based report helper"));
            return tools;
        }
        if (server.serverCode().contains("knowledge")) {
            tools.add(new McpToolDescriptor("kb-retrieval", "RETRIEVAL", "Knowledge retrieval helper"));
        }
        if (server.serverCode().contains("web") || server.transportType() == McpTransportType.SSE) {
            tools.add(new McpToolDescriptor("web-search", "SEARCH", "Web search helper"));
        }
        if (server.serverCode().contains("analysis") || server.transportType() == McpTransportType.STREAMABLE_HTTP) {
            tools.add(new McpToolDescriptor("analysis-helper", "ANALYSIS", "Analysis helper"));
        }
        tools.add(new McpToolDescriptor("report-writer", "SYNTHESIS", "Report synthesis helper"));
        return tools;
    }

    private HealthCheckResult httpHealth(String endpoint) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            boolean ok = response.statusCode() >= 200 && response.statusCode() < 500;
            return new HealthCheckResult(ok ? "UP" : "DOWN", "HTTP " + response.statusCode());
        } catch (IOException | InterruptedException exception) {
            Thread.currentThread().interrupt();
            return new HealthCheckResult("DOWN", exception.getMessage());
        } catch (Exception exception) {
            return new HealthCheckResult("DOWN", exception.getMessage());
        }
    }

    private HealthCheckResult stdioHealth(String commandLine) {
        if (commandLine == null || commandLine.isBlank()) {
            return new HealthCheckResult("DOWN", "commandLine is required for STDIO");
        }
        String executable = commandLine.trim().split("\\s+")[0];
        try {
            Process process = new ProcessBuilder("sh", "-lc", "command -v " + executable).start();
            int exitCode = process.waitFor();
            return exitCode == 0
                    ? new HealthCheckResult("UP", "Executable found")
                    : new HealthCheckResult("DOWN", "Executable not found");
        } catch (Exception exception) {
            return new HealthCheckResult("DOWN", exception.getMessage());
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize MCP payload", exception);
        }
    }

    public record ToolExecutionResult(
            String requestPayload,
            String responsePayload,
            String resultText
    ) {
    }

    public record HealthCheckResult(
            String status,
            String message
    ) {
    }

    private record CachedToolSet(
            List<McpToolDescriptor> tools,
            Instant expiresAt
    ) {
    }
}
