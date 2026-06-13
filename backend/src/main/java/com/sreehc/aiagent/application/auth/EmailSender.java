package com.sreehc.aiagent.application.auth;

public interface EmailSender {
    void sendPasswordReset(String username, String email, String resetToken);
}
