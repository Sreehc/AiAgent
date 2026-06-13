package com.sreehc.aiagent.application.auth;

import com.sreehc.aiagent.app.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.email.provider", havingValue = "log", matchIfMissing = true)
public class NoopEmailSender implements EmailSender {
    private static final Logger log = LoggerFactory.getLogger(NoopEmailSender.class);
    private final AppProperties appProperties;

    public NoopEmailSender(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Override
    public void sendPasswordReset(String username, String email, String resetToken) {
        log.info("Password reset requested for user={} email={} resetUrl={} token={}",
                username,
                email,
                resetUrl(resetToken),
                resetToken);
    }

    private String resetUrl(String resetToken) {
        String baseUrl = appProperties.email() == null || appProperties.email().resetBaseUrl() == null
                ? "http://localhost:5173/reset-password"
                : appProperties.email().resetBaseUrl();
        return baseUrl + "?token=" + resetToken;
    }
}
