package com.sreehc.aiagent.infrastructure.mcp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class McpFrameCodec {
    private static final int MAX_FRAME_BYTES = 1024 * 1024;
    private final ObjectMapper objectMapper;

    public McpFrameCodec(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void write(OutputStream outputStream, Object message) throws IOException {
        byte[] payload = objectMapper.writeValueAsBytes(message);
        if (payload.length > MAX_FRAME_BYTES) {
            throw new IOException("MCP frame exceeds max size");
        }
        outputStream.write(("Content-Length: " + payload.length + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        outputStream.write(payload);
        outputStream.flush();
    }

    public JsonNode read(InputStream inputStream) throws IOException {
        String header = readHeader(inputStream);
        int contentLength = parseContentLength(header);
        if (contentLength <= 0 || contentLength > MAX_FRAME_BYTES) {
            throw new IOException("Invalid MCP Content-Length: " + contentLength);
        }
        byte[] payload = inputStream.readNBytes(contentLength);
        if (payload.length != contentLength) {
            throw new IOException("Unexpected EOF while reading MCP frame");
        }
        return objectMapper.readTree(payload);
    }

    private String readHeader(InputStream inputStream) throws IOException {
        ByteArrayOutputStream header = new ByteArrayOutputStream();
        int value;
        while ((value = inputStream.read()) >= 0) {
            header.write(value);
            byte[] bytes = header.toByteArray();
            int length = bytes.length;
            if (length >= 4
                    && bytes[length - 4] == '\r'
                    && bytes[length - 3] == '\n'
                    && bytes[length - 2] == '\r'
                    && bytes[length - 1] == '\n') {
                return header.toString(StandardCharsets.UTF_8);
            }
            if (length > 8192) {
                throw new IOException("MCP header exceeds max size");
            }
        }
        throw new IOException("Unexpected EOF while reading MCP header");
    }

    private int parseContentLength(String header) throws IOException {
        for (String line : header.split("\r\n")) {
            int separator = line.indexOf(':');
            if (separator > 0 && "content-length".equalsIgnoreCase(line.substring(0, separator).trim())) {
                return Integer.parseInt(line.substring(separator + 1).trim());
            }
        }
        throw new IOException("MCP frame missing Content-Length");
    }
}
