package com.sreehc.aiagent.infrastructure.mcp;

import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpToolDescriptor;
import java.util.List;

public interface McpTransportClient {
    boolean supports(McpServerConfig server);

    List<McpToolDescriptor> discoverTools(McpServerConfig server);

    McpRuntimeGateway.ToolExecutionResult invoke(McpServerConfig server, McpToolDescriptor tool, String stepTitle, String input);
}
