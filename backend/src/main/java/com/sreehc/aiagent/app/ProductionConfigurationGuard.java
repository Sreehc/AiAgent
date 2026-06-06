package com.sreehc.aiagent.app;

import java.util.Arrays;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ProductionConfigurationGuard implements ApplicationRunner {
    private static final String PRODUCTION_PROFILE = "prod";

    private final AppProperties appProperties;
    private final Environment environment;
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public ProductionConfigurationGuard(
            AppProperties appProperties,
            Environment environment,
            NamedParameterJdbcTemplate jdbcTemplate
    ) {
        this.appProperties = appProperties;
        this.environment = environment;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!isProductionProfile()) {
            return;
        }
        if (Boolean.TRUE.equals(appProperties.bootstrap().demoDataEnabled())) {
            throw new IllegalStateException("APP_BOOTSTRAP_DEMO_DATA_ENABLED must be false in production");
        }
        if (isWeakSecret(environment.getProperty("app.security.jwt-secret"))) {
            throw new IllegalStateException("APP_JWT_SECRET must be replaced before production startup");
        }
        if (isWeakSecret(appProperties.storage().accessKey()) || isWeakSecret(appProperties.storage().secretKey())) {
            throw new IllegalStateException("MinIO credentials must be replaced before production startup");
        }
        if (appProperties.storage().presignedUrlTtlSeconds() == null
                || appProperties.storage().presignedUrlTtlSeconds() > 3600) {
            throw new IllegalStateException("APP_STORAGE_PRESIGNED_URL_TTL_SECONDS must be configured to 3600 seconds or less in production");
        }
        if ("local-mock".equalsIgnoreCase(appProperties.embedding().provider())
                || "local-mock".equalsIgnoreCase(appProperties.chat().provider())
                || "local-mock".equalsIgnoreCase(appProperties.image().provider())) {
            throw new IllegalStateException("Mock model providers must not be used as production defaults");
        }
        requireProviderConfiguration("embedding", appProperties.embedding().provider(), appProperties.embedding().modelCode(), appProperties.embedding().baseUrl(), appProperties.embedding().apiKey());
        requireProviderConfiguration("chat", appProperties.chat().provider(), appProperties.chat().modelCode(), appProperties.chat().baseUrl(), appProperties.chat().apiKey());
        requireProviderConfiguration("image", appProperties.image().provider(), appProperties.image().modelCode(), appProperties.image().baseUrl(), appProperties.image().apiKey());
        if (hasActiveDemoInvite()) {
            throw new IllegalStateException("Default demo invite tokens must be disabled or expired before production startup");
        }
    }

    private void requireProviderConfiguration(String name, String provider, String modelCode, String baseUrl, String apiKey) {
        if (isBlank(provider) || isBlank(modelCode) || isBlank(baseUrl) || isBlank(apiKey)) {
            throw new IllegalStateException("Production " + name + " provider requires provider, model code, base URL, and API key");
        }
    }

    private boolean hasActiveDemoInvite() {
        Integer count = jdbcTemplate.queryForObject(
                """
                        select count(1)
                        from invite_registration
                        where invite_token in ('INVITE-ABC', 'INVITE-DEF', 'INVITE-GHI', 'INVITE-JKL')
                          and status = 'NEW'
                          and expires_at > now()
                        """,
                java.util.Map.of(),
                Integer.class
        );
        return count != null && count > 0;
    }

    private boolean isProductionProfile() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> PRODUCTION_PROFILE.equalsIgnoreCase(profile));
    }

    private boolean isWeakSecret(String value) {
        return isBlank(value)
                || "change-me".equalsIgnoreCase(value)
                || value.toLowerCase().contains("change-me")
                || "minioadmin".equalsIgnoreCase(value)
                || "root".equalsIgnoreCase(value)
                || "postgres".equalsIgnoreCase(value);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
