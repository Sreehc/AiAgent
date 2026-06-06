package com.sreehc.aiagent.application.mcp;

import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpToolDescriptor;
import com.sreehc.aiagent.domain.mcp.ToolInvocationRecord;
import com.sreehc.aiagent.infrastructure.mcp.McpRuntimeGateway;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.infrastructure.mcp.McpServerRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class McpExecutionService {
    private final McpServerRepository mcpServerRepository;
    private final McpRuntimeGateway mcpRuntimeGateway;
    private final ObjectMapper objectMapper;

    public McpExecutionService(McpServerRepository mcpServerRepository, McpRuntimeGateway mcpRuntimeGateway, ObjectMapper objectMapper) {
        this.mcpServerRepository = mcpServerRepository;
        this.mcpRuntimeGateway = mcpRuntimeGateway;
        this.objectMapper = objectMapper;
    }

    public InvocationResult invokeForStep(long runId, String stepToolName, String stepTitle, String input) {
        for (McpServerConfig server : mcpServerRepository.listActiveServers()) {
            List<McpToolDescriptor> discovered = mcpRuntimeGateway.discoverTools(server);
            McpToolDescriptor tool = mcpRuntimeGateway.pickToolForStep(discovered, stepToolName);
            if (tool == null) {
                continue;
            }
            String toolCallId = "tool_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            long invocationId = mcpServerRepository.createToolInvocation(
                    runId,
                    toolCallId,
                    tool.toolName(),
                    tool.toolType(),
                    writeRequestPayload(stepToolName, stepTitle, input)
            );
            try {
                McpRuntimeGateway.ToolExecutionResult result = mcpRuntimeGateway.invoke(server, tool, stepTitle, input);
                mcpServerRepository.markToolInvocationSuccess(invocationId, result.responsePayload());
                return new InvocationResult(
                        toolCallId,
                        server.serverCode(),
                        tool.toolName(),
                        tool.toolType(),
                        result.resultText(),
                        true
                );
            } catch (Exception exception) {
                String errorPayload = "{\"message\":\"" + sanitize(exception.getMessage()) + "\"}";
                mcpServerRepository.markToolInvocationFailed(invocationId, errorPayload);
                return new InvocationResult(
                        toolCallId,
                        server.serverCode(),
                        tool.toolName(),
                        tool.toolType(),
                        "Tool invocation failed, fallback to built-in flow",
                        false
                );
            }
        }
        return null;
    }

    public List<ToolInvocationSummary> listInvocations(long runId) {
        return mcpServerRepository.listByRunId(runId).stream()
                .map(this::toSummary)
                .toList();
    }

    private ToolInvocationSummary toSummary(ToolInvocationRecord record) {
        return new ToolInvocationSummary(
                record.toolCallId(),
                record.toolName(),
                record.toolType(),
                record.status().name(),
                record.requestPayload(),
                record.responsePayload(),
                record.startedAt(),
                record.endedAt()
        );
    }

    private String writeRequestPayload(String stepToolName, String stepTitle, String input) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "stepToolName", stepToolName,
                    "stepTitle", stepTitle,
                    "input", input
            ));
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to serialize MCP request payload", exception);
        }
    }

    private String sanitize(String message) {
        if (message == null) {
            return "unknown";
        }
        return message.replace("\"", "'");
    }

    public record InvocationResult(
            String toolCallId,
            String serverCode,
            String toolName,
            String toolType,
            String resultText,
            boolean success
    ) {
    }

    public record ToolInvocationSummary(
            String toolCallId,
            String toolName,
            String toolType,
            String status,
            String requestPayload,
            String responsePayload,
            Instant startedAt,
            Instant endedAt
    ) {
    }
}
