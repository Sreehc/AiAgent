package com.sreehc.aiagent.app;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Auth auth,
        Storage storage
) {
    public record Auth(
            long sessionTtlSeconds
    ) {
    }

    public record Storage(
            String endpoint,
            String accessKey,
            String secretKey,
            String bucket
    ) {
    }
}
