package com.sreehc.aiagent.infrastructure.mcp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpToolDescriptor;
import com.sreehc.aiagent.domain.mcp.McpTransportType;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class HttpMcpTransportClient implements McpTransportClient {
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    public HttpMcpTransportClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(McpServerConfig server) {
        return server.transportType() == McpTransportType.SSE || server.transportType() == McpTransportType.STREAMABLE_HTTP;
    }

    @Override
    public List<McpToolDescriptor> discoverTools(McpServerConfig server) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(server.endpoint()))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(Map.of(
                            "jsonrpc", "2.0",
                            "id", "tools-list",
                            "method", "tools/list"
                    ))))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("MCP tools/list returned HTTP " + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode tools = root.path("result").path("tools");
            List<McpToolDescriptor> descriptors = new ArrayList<>();
            if (tools.isArray()) {
                for (JsonNode tool : tools) {
                    descriptors.add(new McpToolDescriptor(
                            tool.path("name").asText("unknown-tool"),
                            tool.path("type").asText("GENERIC"),
                            tool.path("description").asText("")
                    ));
                }
            }
            return descriptors;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to discover MCP tools", exception);
        }
    }

    @Override
    public McpRuntimeGateway.ToolExecutionResult invoke(McpServerConfig server, McpToolDescriptor tool, String stepTitle, String input) {
        try {
            Map<String, Object> payload = Map.of(
                    "jsonrpc", "2.0",
                    "id", "tool-call",
                    "method", "tools/call",
                    "params", Map.of(
                            "name", tool.toolName(),
                            "arguments", Map.of(
                                    "stepTitle", stepTitle,
                                    "input", input
                            )
                    )
            );
            String requestPayload = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder(URI.create(server.endpoint()))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestPayload))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("MCP tools/call returned HTTP " + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            String resultText = root.path("result").path("content").isArray()
                    ? root.path("result").path("content").toString()
                    : root.path("result").toString();
            return new McpRuntimeGateway.ToolExecutionResult(requestPayload, response.body(), resultText);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to invoke MCP tool", exception);
        }
    }
}
