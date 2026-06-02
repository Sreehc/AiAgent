package com.sreehc.aiagent.infrastructure.admin;

import com.sreehc.aiagent.domain.admin.AdminInvite;
import com.sreehc.aiagent.domain.admin.ModelConfig;
import com.sreehc.aiagent.domain.admin.ModelType;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AdminSettingsRepository {
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AdminSettingsRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long createModelConfig(
            String modelCode,
            String name,
            String provider,
            ModelType modelType,
            String baseUrl,
            String apiKey,
            boolean enabled,
            long createdBy
    ) {
        Long id = jdbcTemplate.queryForObject("""
                        insert into model_config (
                            model_code, name, provider, model_type, base_url, api_key,
                            enabled, created_by, created_at, updated_at
                        )
                        values (
                            :modelCode, :name, :provider, :modelType, :baseUrl, :apiKey,
                            :enabled, :createdBy, now(), now()
                        )
                        returning id
                        """,
                new MapSqlParameterSource()
                        .addValue("modelCode", modelCode)
                        .addValue("name", name)
                        .addValue("provider", provider)
                        .addValue("modelType", modelType.name())
                        .addValue("baseUrl", baseUrl)
                        .addValue("apiKey", apiKey)
                        .addValue("enabled", enabled)
                        .addValue("createdBy", createdBy),
                Long.class
        );
        if (id == null) {
            throw new IllegalStateException("Failed to create model config");
        }
        return id;
    }

    public List<ModelConfig> listModelConfigs() {
        return jdbcTemplate.query("""
                        select id, model_code, name, provider, model_type, base_url, api_key,
                               enabled, created_at, updated_at
                        from model_config
                        order by created_at desc
                        """,
                (rs, rowNum) -> mapModelConfig(rs));
    }

    public Optional<ModelConfig> findModelConfigById(long id) {
        return jdbcTemplate.query("""
                        select id, model_code, name, provider, model_type, base_url, api_key,
                               enabled, created_at, updated_at
                        from model_config
                        where id = :id
                        """,
                Map.of("id", id),
                rs -> rs.next() ? Optional.of(mapModelConfig(rs)) : Optional.empty());
    }

    public void createInvite(String inviteToken, long createdBy, java.time.Instant expiresAt) {
        jdbcTemplate.update("""
                        insert into invite_registration (
                            invite_token, status, created_by, expires_at, created_at
                        )
                        values (
                            :inviteToken, 'NEW', :createdBy, :expiresAt, now()
                        )
                        """,
                new MapSqlParameterSource()
                        .addValue("inviteToken", inviteToken)
                        .addValue("createdBy", createdBy)
                        .addValue("expiresAt", java.sql.Timestamp.from(expiresAt)));
    }

    public List<AdminInvite> listInvites(int limit) {
        return jdbcTemplate.query("""
                        select invite_token, status, expires_at, created_at
                        from invite_registration
                        order by created_at desc
                        limit :limit
                        """,
                Map.of("limit", limit),
                (rs, rowNum) -> new AdminInvite(
                        rs.getString("invite_token"),
                        rs.getString("status"),
                        rs.getTimestamp("expires_at").toInstant(),
                        rs.getTimestamp("created_at").toInstant()
                ));
    }

    private ModelConfig mapModelConfig(ResultSet rs) throws SQLException {
        return new ModelConfig(
                rs.getLong("id"),
                rs.getString("model_code"),
                rs.getString("name"),
                rs.getString("provider"),
                ModelType.valueOf(rs.getString("model_type")),
                rs.getString("base_url"),
                maskApiKey(rs.getString("api_key")),
                rs.getBoolean("enabled"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }

    private String maskApiKey(String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            return null;
        }
        if (apiKey.length() <= 8) {
            return "****";
        }
        return apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length() - 4);
    }
}
