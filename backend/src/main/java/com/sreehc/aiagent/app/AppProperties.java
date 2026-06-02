package com.sreehc.aiagent.app;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Auth auth
) {
    public record Auth(
            long sessionTtlSeconds
    ) {
    }
}

