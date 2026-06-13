package com.sreehc.aiagent.infrastructure.mcp;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public final class FakeStdioMcpServer {
    private FakeStdioMcpServer() {
    }

    public static void main(String[] args) throws Exception {
        InputStream stdin = System.in;
        OutputStream stdout = System.out;
        int handledRequests = 0;
        while (true) {
            String payload = readFrame(stdin);
            if (payload == null) {
                return;
            }
            if (payload.contains("\"method\":\"initialize\"")) {
                writeFrame(stdout, "{\"jsonrpc\":\"2.0\",\"id\":\"initialize\",\"result\":{\"protocolVersion\":\"2024-11-05\",\"capabilities\":{},\"serverInfo\":{\"name\":\"fake-stdio\",\"version\":\"1.0\"}}}");
            } else if (payload.contains("\"method\":\"notifications/initialized\"")) {
                // notification has no response
            } else if (payload.contains("\"method\":\"tools/list\"")) {
                handledRequests++;
                writeFrame(stdout, "{\"jsonrpc\":\"2.0\",\"id\":\"tools-list\",\"result\":{\"tools\":[{\"name\":\"echo\",\"type\":\"GENERIC\",\"description\":\"Echo fake tool\"}]}}");
            } else if (payload.contains("\"method\":\"tools/call\"")) {
                handledRequests++;
                writeFrame(stdout, "{\"jsonrpc\":\"2.0\",\"id\":\"tool-call\",\"result\":{\"content\":[{\"type\":\"text\",\"text\":\"requestCount=" + handledRequests + "\"}]}}");
            } else {
                writeFrame(stdout, "{\"jsonrpc\":\"2.0\",\"id\":\"unknown\",\"error\":{\"code\":-32601,\"message\":\"Method not found\"}}");
            }
        }
    }

    private static String readFrame(InputStream inputStream) throws Exception {
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
                break;
            }
        }
        if (header.size() == 0 && value < 0) {
            return null;
        }
        int contentLength = 0;
        for (String line : header.toString(StandardCharsets.UTF_8).split("\r\n")) {
            int separator = line.indexOf(':');
            if (separator > 0 && "content-length".equalsIgnoreCase(line.substring(0, separator).trim())) {
                contentLength = Integer.parseInt(line.substring(separator + 1).trim());
            }
        }
        byte[] payload = inputStream.readNBytes(contentLength);
        return new String(payload, StandardCharsets.UTF_8);
    }

    private static void writeFrame(OutputStream outputStream, String payload) throws Exception {
        byte[] bytes = payload.getBytes(StandardCharsets.UTF_8);
        outputStream.write(("Content-Length: " + bytes.length + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        outputStream.write(bytes);
        outputStream.flush();
    }
}
