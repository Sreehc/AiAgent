package com.sreehc.aiagent.infrastructure.mcp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpToolDescriptor;
import com.sreehc.aiagent.domain.mcp.McpTransportType;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

@Component
public class StdioMcpTransportClient implements McpTransportClient {
    private final ObjectMapper objectMapper;

    public StdioMcpTransportClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(McpServerConfig server) {
        return server.transportType() == McpTransportType.STDIO;
    }

    @Override
    public List<McpToolDescriptor> discoverTools(McpServerConfig server) {
        return List.of(new McpToolDescriptor(server.serverCode() + "-stdio", "GENERIC", "STDIO MCP placeholder tool"));
    }

    @Override
    public McpRuntimeGateway.ToolExecutionResult invoke(McpServerConfig server, McpToolDescriptor tool, String stepTitle, String input) {
        try {
            String[] command = server.commandLine().trim().split("\\s+");
            Process process = new ProcessBuilder(command)
                    .redirectErrorStream(true)
                    .start();
            String requestPayload = objectMapper.writeValueAsString(Map.of(
                    "tool", tool.toolName(),
                    "stepTitle", stepTitle,
                    "input", input
            ));
            process.outputWriter().write(requestPayload);
            process.outputWriter().write("\n");
            process.outputWriter().flush();
            boolean completed = process.waitFor(10, TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                throw new IllegalStateException("STDIO MCP tool invocation timed out");
            }
            StringBuilder response = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line).append('\n');
                }
            }
            String responsePayload = response.toString().trim();
            return new McpRuntimeGateway.ToolExecutionResult(requestPayload, responsePayload, responsePayload.isBlank() ? "STDIO MCP completed" : responsePayload);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to invoke STDIO MCP tool", exception);
        }
    }
}
