package com.sreehc.aiagent.application.auth;

import com.sreehc.aiagent.app.AppProperties;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class SmtpEmailSenderTest {

    @Test
    void shouldSendResetEmailThroughSmtpWithAuth() throws Exception {
        try (FakeSmtpServer server = new FakeSmtpServer()) {
            CompletableFuture<List<String>> transcript = server.start();
            SmtpEmailSender sender = new SmtpEmailSender(appProperties(server.port()));

            sender.sendPasswordReset("alice", "alice@example.com", "reset-token-123");

            List<String> commands = transcript.get(5, TimeUnit.SECONDS);
            assertTrue(commands.contains("AUTH LOGIN"), commands.toString());
            assertTrue(commands.contains(Base64.getEncoder().encodeToString("smtp-user".getBytes(StandardCharsets.UTF_8))), commands.toString());
            assertTrue(commands.contains(Base64.getEncoder().encodeToString("smtp-pass".getBytes(StandardCharsets.UTF_8))), commands.toString());
            assertTrue(commands.contains("MAIL FROM:<no-reply@aiagent.local>"), commands.toString());
            assertTrue(commands.contains("RCPT TO:<alice@example.com>"), commands.toString());
            assertTrue(commands.stream().anyMatch(line -> line.contains("http://localhost:5173/reset-password?token=reset-token-123")), commands.toString());
        }
    }

    private static AppProperties appProperties(int port) {
        return new AppProperties(
                new AppProperties.Auth(7200L, 5, 600L),
                new AppProperties.Storage("http://localhost:9000", "minioadmin", "minioadmin", "aiagent", 900L),
                new AppProperties.Embedding("local-mock", "text-embedding-3-small", "https://api.openai.com/v1", "", 1536, 5000L, 15000L),
                new AppProperties.Kafka("localhost:9092", "aiagent.knowledge.index", "aiagent-backend"),
                new AppProperties.Rag(3600L, 300L, 1500L),
                new AppProperties.Chat("local-mock", "claude-sonnet-4-6", "", ""),
                new AppProperties.Image("local-mock", "image-generation-default", "", ""),
                new AppProperties.Mcp("localhost", false, ""),
                new AppProperties.Email("smtp", "no-reply@aiagent.local", "http://localhost:5173/reset-password", "127.0.0.1", port, "smtp-user", "smtp-pass", false, false, 5000L, 10000L),
                new AppProperties.Run(3, 8, 10L),
                new AppProperties.Bootstrap(true),
                new AppProperties.Secret("")
        );
    }

    private static final class FakeSmtpServer implements AutoCloseable {
        private final ServerSocket serverSocket;

        private FakeSmtpServer() throws Exception {
            this.serverSocket = new ServerSocket(0);
        }

        private int port() {
            return serverSocket.getLocalPort();
        }

        private CompletableFuture<List<String>> start() {
            return CompletableFuture.supplyAsync(() -> {
                List<String> transcript = new ArrayList<>();
                try (Socket socket = serverSocket.accept();
                     BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
                     BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8))) {
                    write(writer, "220 fake smtp ready");
                    boolean inData = false;
                    String line;
                    while ((line = reader.readLine()) != null) {
                        transcript.add(line);
                        if (inData) {
                            if (".".equals(line)) {
                                inData = false;
                                write(writer, "250 queued");
                            }
                            continue;
                        }
                        if (line.startsWith("EHLO")) {
                            write(writer, "250-fake.local");
                            write(writer, "250 AUTH LOGIN");
                        } else if ("DATA".equals(line)) {
                            inData = true;
                            write(writer, "354 end with dot");
                        } else if ("QUIT".equals(line)) {
                            write(writer, "221 bye");
                            return transcript;
                        } else {
                            write(writer, "250 ok");
                        }
                    }
                    return transcript;
                } catch (Exception exception) {
                    throw new IllegalStateException(exception);
                }
            });
        }

        private static void write(BufferedWriter writer, String line) throws Exception {
            writer.write(line + "\r\n");
            writer.flush();
        }

        @Override
        public void close() throws Exception {
            serverSocket.close();
        }
    }
}
