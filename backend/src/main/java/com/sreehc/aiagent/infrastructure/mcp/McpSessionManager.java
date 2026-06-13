package com.sreehc.aiagent.infrastructure.mcp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import jakarta.annotation.PreDestroy;
import java.io.InputStream;
import java.io.OutputStream;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

@Component
public class McpSessionManager {
    private static final Duration CALL_TIMEOUT = Duration.ofSeconds(10);
    private final ObjectMapper objectMapper;
    private final McpFrameCodec frameCodec;
    private final Map<String, ManagedSession> sessions = new ConcurrentHashMap<>();

    public McpSessionManager(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.frameCodec = new McpFrameCodec(objectMapper);
    }

    public JsonNode withInitializedSession(McpServerConfig server, Map<String, Object> request) {
        try {
            ManagedSession session = sessions.compute(sessionKey(server), (key, existing) -> {
                if (existing != null && existing.isAlive()) {
                    return existing;
                }
                closeQuietly(existing);
                return new ManagedSession(server);
            });
            return session.request(request);
        } catch (Exception exception) {
            closeSession(server);
            throw new IllegalStateException("STDIO MCP request failed", exception);
        }
    }

    public void closeSession(McpServerConfig server) {
        closeQuietly(sessions.remove(sessionKey(server)));
    }

    @PreDestroy
    public void closeAll() {
        sessions.values().forEach(this::closeQuietly);
        sessions.clear();
    }

    private JsonNode readResponseById(InputStream stdout, String id) throws Exception {
        while (true) {
            JsonNode message = frameCodec.read(stdout);
            if (message.has("id") && id.equals(message.path("id").asText())) {
                if (message.has("error")) {
                    throw new IllegalStateException("MCP error response: " + objectMapper.writeValueAsString(message.path("error")));
                }
                return message;
            }
        }
    }

    private Map<String, Object> initializeRequest() {
        return Map.of(
                "jsonrpc", "2.0",
                "id", "initialize",
                "method", "initialize",
                "params", Map.of(
                        "protocolVersion", "2024-11-05",
                        "capabilities", Map.of(),
                        "clientInfo", Map.of("name", "AiAgent", "version", "1.0")
                )
        );
    }

    private String sessionKey(McpServerConfig server) {
        return server.serverCode() + "::" + server.commandLine();
    }

    private List<String> splitCommand(String commandLine) {
        if (commandLine == null || commandLine.isBlank()) {
            throw new IllegalArgumentException("STDIO command line is required");
        }
        return List.of(commandLine.trim().split("\\s+"));
    }

    private void closeQuietly(ManagedSession session) {
        if (session != null) {
            session.close();
        }
    }

    private final class ManagedSession {
        private final Process process;
        private final InputStream stdout;
        private final OutputStream stdin;
        private final Object lock = new Object();
        private boolean initialized;

        private ManagedSession(McpServerConfig server) {
            try {
                this.process = new ProcessBuilder(splitCommand(server.commandLine()))
                        .redirectErrorStream(false)
                        .start();
                this.stdout = process.getInputStream();
                this.stdin = process.getOutputStream();
            } catch (Exception exception) {
                throw new IllegalStateException("Failed to start STDIO MCP process", exception);
            }
        }

        private boolean isAlive() {
            return process.isAlive();
        }

        private JsonNode request(Map<String, Object> request) throws Exception {
            try {
                return CompletableFuture.supplyAsync(() -> {
                    synchronized (lock) {
                        try {
                            initializeIfNeeded();
                            frameCodec.write(stdin, request);
                            return readResponseById(stdout, String.valueOf(request.get("id")));
                        } catch (Exception exception) {
                            throw new IllegalStateException(exception);
                        }
                    }
                }).get(CALL_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS);
            } catch (Exception exception) {
                close();
                throw exception;
            }
        }

        private void initializeIfNeeded() throws Exception {
            if (initialized) {
                return;
            }
            frameCodec.write(stdin, initializeRequest());
            readResponseById(stdout, "initialize");
            frameCodec.write(stdin, Map.of("jsonrpc", "2.0", "method", "notifications/initialized"));
            initialized = true;
        }

        private void close() {
            process.destroy();
            try {
                if (!process.waitFor(500, TimeUnit.MILLISECONDS)) {
                    process.destroyForcibly();
                }
            } catch (InterruptedException interruptedException) {
                Thread.currentThread().interrupt();
                process.destroyForcibly();
            }
        }
    }
}
