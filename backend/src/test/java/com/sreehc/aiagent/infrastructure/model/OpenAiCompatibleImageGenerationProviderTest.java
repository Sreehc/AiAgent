package com.sreehc.aiagent.infrastructure.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OpenAiCompatibleImageGenerationProviderTest {
    private HttpServer server;

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void shouldSendMultipartEditRequestWhenReferenceImageIsPresent() throws Exception {
        AtomicReference<CapturedRequest> captured = new AtomicReference<>();
        startServer("/images/edits", captured);
        OpenAiCompatibleImageGenerationProvider provider = new OpenAiCompatibleImageGenerationProvider(new ObjectMapper());

        ImageGenerationProvider.GeneratedImage image = provider.generate(new ImageGenerationProvider.ImageRequest(
                "edit this image",
                "1024x1024",
                "gpt-image-1",
                baseUrl(),
                "secret-key",
                "image/png".getBytes(StandardCharsets.UTF_8),
                "image/png"
        ));

        assertEquals("png", image.fileExtension());
        assertEquals("Bearer secret-key", captured.get().authorization());
        assertTrue(captured.get().contentType().startsWith("multipart/form-data; boundary="), captured.get().contentType());
        assertTrue(captured.get().body().contains("name=\"model\""));
        assertTrue(captured.get().body().contains("gpt-image-1"));
        assertTrue(captured.get().body().contains("name=\"prompt\""));
        assertTrue(captured.get().body().contains("edit this image"));
        assertTrue(captured.get().body().contains("name=\"image\"; filename=\"reference.png\""));
        assertTrue(captured.get().body().contains("Content-Type: image/png"));
    }

    @Test
    void shouldSendJsonGenerationRequestWhenNoReferenceImageIsPresent() throws Exception {
        AtomicReference<CapturedRequest> captured = new AtomicReference<>();
        startServer("/images/generations", captured);
        OpenAiCompatibleImageGenerationProvider provider = new OpenAiCompatibleImageGenerationProvider(new ObjectMapper());

        provider.generate(new ImageGenerationProvider.ImageRequest(
                "draw a diagram",
                "1024x1024",
                "gpt-image-1",
                baseUrl(),
                "secret-key",
                null,
                null
        ));

        assertEquals("application/json", captured.get().contentType());
        assertTrue(captured.get().body().contains("\"prompt\":\"draw a diagram\""));
        assertTrue(captured.get().body().contains("\"response_format\":\"b64_json\""));
    }

    private void startServer(String path, AtomicReference<CapturedRequest> captured) throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext(path, exchange -> handle(exchange, captured));
        server.start();
    }

    private void handle(HttpExchange exchange, AtomicReference<CapturedRequest> captured) throws java.io.IOException {
        byte[] requestBody = exchange.getRequestBody().readAllBytes();
        captured.set(new CapturedRequest(
                exchange.getRequestURI().getPath(),
                exchange.getRequestHeaders().getFirst("Authorization"),
                exchange.getRequestHeaders().getFirst("Content-Type"),
                new String(requestBody, StandardCharsets.UTF_8)
        ));
        String response = "{\"data\":[{\"b64_json\":\"" + Base64.getEncoder().encodeToString("fake-image".getBytes(StandardCharsets.UTF_8)) + "\"}]}";
        byte[] responseBytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(200, responseBytes.length);
        exchange.getResponseBody().write(responseBytes);
        exchange.close();
    }

    private String baseUrl() {
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    private record CapturedRequest(
            String path,
            String authorization,
            String contentType,
            String body
    ) {
    }
}
