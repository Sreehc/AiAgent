package com.sreehc.aiagent.infrastructure.mcp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpServerStatus;
import com.sreehc.aiagent.domain.mcp.McpToolDescriptor;
import com.sreehc.aiagent.domain.mcp.McpTransportType;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StdioMcpTransportClientTest {
    private final McpSessionManager sessionManager = new McpSessionManager(new ObjectMapper());
    private final StdioMcpTransportClient client = new StdioMcpTransportClient(new ObjectMapper(), sessionManager);

    @AfterEach
    void tearDown() {
        sessionManager.closeAll();
    }

    @Test
    void shouldReuseInitializedStdioProcessForListAndCall() {
        McpServerConfig server = server();

        List<McpToolDescriptor> tools = client.discoverTools(server);
        McpRuntimeGateway.ToolExecutionResult result = client.invoke(server, tools.getFirst(), "step", "input");

        assertEquals(1, tools.size());
        assertEquals("echo", tools.getFirst().toolName());
        assertTrue(result.resultText().contains("requestCount=2"), result.resultText());
    }

    private McpServerConfig server() {
        String javaBin = Path.of(System.getProperty("java.home"), "bin", "java").toString();
        String classPath = System.getProperty("java.class.path");
        String command = javaBin + " -cp " + classPath + " " + FakeStdioMcpServer.class.getName();
        Instant now = Instant.now();
        return new McpServerConfig(
                1L,
                "fake-stdio",
                "Fake STDIO",
                McpTransportType.STDIO,
                null,
                command,
                McpServerStatus.ACTIVE,
                1L,
                now,
                now
        );
    }
}
