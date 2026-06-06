package com.sreehc.aiagent.application.auth;

import org.springframework.stereotype.Service;

@Service
public class NoopEmailSender {
    public void sendPasswordReset(String username, String email, String resetToken) {
        // Intentionally no-op for local development.
    }
}
