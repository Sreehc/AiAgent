package com.sreehc.aiagent.infrastructure.mcp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpToolDescriptor;
import com.sreehc.aiagent.domain.mcp.McpTransportType;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class StdioMcpTransportClient implements McpTransportClient {
    private final ObjectMapper objectMapper;
    private final McpSessionManager sessionManager;

    public StdioMcpTransportClient(ObjectMapper objectMapper, McpSessionManager sessionManager) {
        this.objectMapper = objectMapper;
        this.sessionManager = sessionManager;
    }

    @Override
    public boolean supports(McpServerConfig server) {
        return server.transportType() == McpTransportType.STDIO;
    }

    @Override
    public List<McpToolDescriptor> discoverTools(McpServerConfig server) {
        try {
            JsonNode response = sessionManager.withInitializedSession(server, Map.of(
                    "jsonrpc", "2.0",
                    "id", "tools-list",
                    "method", "tools/list"
            ));
            List<McpToolDescriptor> descriptors = new ArrayList<>();
            JsonNode tools = response.path("result").path("tools");
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
            throw new IllegalStateException("Failed to discover STDIO MCP tools", exception);
        }
    }

    @Override
    public McpRuntimeGateway.ToolExecutionResult invoke(McpServerConfig server, McpToolDescriptor tool, String stepTitle, String input) {
        try {
            Map<String, Object> request = Map.of(
                    "jsonrpc", "2.0",
                    "id", "tool-call",
                    "method", "tools/call",
                    "params", Map.of(
                            "name", tool.toolName(),
                            "arguments", Map.of("stepTitle", stepTitle, "input", input)
                    )
            );
            JsonNode response = sessionManager.withInitializedSession(server, request);
            String responsePayload = objectMapper.writeValueAsString(response);
            return new McpRuntimeGateway.ToolExecutionResult(
                    objectMapper.writeValueAsString(request),
                    responsePayload,
                    resultText(response)
            );
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to invoke STDIO MCP tool", exception);
        }
    }

    private String resultText(JsonNode response) {
        JsonNode content = response.path("result").path("content");
        if (content.isArray() && !content.isEmpty()) {
            List<String> parts = new ArrayList<>();
            for (JsonNode item : content) {
                if (item.has("text")) {
                    parts.add(item.path("text").asText());
                }
            }
            if (!parts.isEmpty()) {
                return String.join("\n", parts);
            }
        }
        JsonNode result = response.path("result");
        return result.isMissingNode() ? response.toString() : result.toString();
    }
}
