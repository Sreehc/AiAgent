package com.sreehc.aiagent.application.auth;

import com.sreehc.aiagent.app.AppProperties;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.net.ssl.SSLSocketFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.email.provider", havingValue = "smtp")
public class SmtpEmailSender implements EmailSender {
    private final AppProperties appProperties;

    public SmtpEmailSender(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Override
    public void sendPasswordReset(String username, String email, String resetToken) {
        if (email == null || email.isBlank()) {
            return;
        }
        try (Socket socket = openSocket()) {
            BufferedReader reader = reader(socket);
            BufferedWriter writer = writer(socket);
            expect(reader);
            command(writer, reader, "EHLO aiagent.local");
            if (Boolean.TRUE.equals(appProperties.email().startTls())) {
                command(writer, reader, "STARTTLS");
                Socket tlsSocket = ((SSLSocketFactory) SSLSocketFactory.getDefault()).createSocket(socket, appProperties.email().host(), resolvePort(), true);
                tlsSocket.setSoTimeout(resolveReadTimeoutMillis());
                reader = reader(tlsSocket);
                writer = writer(tlsSocket);
                command(writer, reader, "EHLO aiagent.local");
            }
            if (appProperties.email().username() != null && !appProperties.email().username().isBlank()) {
                command(writer, reader, "AUTH LOGIN");
                command(writer, reader, Base64.getEncoder().encodeToString(appProperties.email().username().getBytes(StandardCharsets.UTF_8)));
                command(writer, reader, Base64.getEncoder().encodeToString((appProperties.email().password() == null ? "" : appProperties.email().password()).getBytes(StandardCharsets.UTF_8)));
            }
            command(writer, reader, "MAIL FROM:<" + appProperties.email().from() + ">");
            command(writer, reader, "RCPT TO:<" + email + ">");
            command(writer, reader, "DATA");
            writer.write("Subject: AiAgent password reset\r\n");
            writer.write("From: " + appProperties.email().from() + "\r\n");
            writer.write("To: " + email + "\r\n");
            writer.write("Content-Type: text/plain; charset=UTF-8\r\n\r\n");
            writer.write("Hi " + username + ",\r\n\r\nUse this link to reset your password:\r\n"
                    + appProperties.email().resetBaseUrl() + "?token=" + resetToken
                    + "\r\n\r\nThis link expires in 30 minutes.\r\n.\r\n");
            writer.flush();
            expect(reader);
            command(writer, reader, "QUIT");
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to send password reset email", exception);
        }
    }

    private int resolvePort() {
        return appProperties.email().port() == null ? 25 : appProperties.email().port();
    }

    private int resolveConnectTimeoutMillis() {
        return appProperties.email().connectTimeoutMillis() == null ? 5000 : appProperties.email().connectTimeoutMillis().intValue();
    }

    private int resolveReadTimeoutMillis() {
        return appProperties.email().readTimeoutMillis() == null ? 10000 : appProperties.email().readTimeoutMillis().intValue();
    }

    private Socket openSocket() throws Exception {
        Socket socket = Boolean.TRUE.equals(appProperties.email().ssl())
                ? SSLSocketFactory.getDefault().createSocket()
                : new Socket();
        socket.connect(new InetSocketAddress(appProperties.email().host(), resolvePort()), resolveConnectTimeoutMillis());
        socket.setSoTimeout(resolveReadTimeoutMillis());
        return socket;
    }

    private BufferedReader reader(Socket socket) throws Exception {
        return new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
    }

    private BufferedWriter writer(Socket socket) throws Exception {
        return new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8));
    }

    private void command(BufferedWriter writer, BufferedReader reader, String command) throws Exception {
        writer.write(command + "\r\n");
        writer.flush();
        expect(reader);
    }

    private void expect(BufferedReader reader) throws Exception {
        String line = reader.readLine();
        if (line == null || line.startsWith("4") || line.startsWith("5")) {
            throw new IllegalStateException("SMTP command failed: " + line);
        }
        while (line.length() > 3 && line.charAt(3) == '-') {
            line = reader.readLine();
            if (line == null || line.startsWith("4") || line.startsWith("5")) {
                throw new IllegalStateException("SMTP command failed: " + line);
            }
        }
    }
}
