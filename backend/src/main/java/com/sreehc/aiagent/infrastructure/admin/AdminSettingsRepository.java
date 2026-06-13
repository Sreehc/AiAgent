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
            String apiKeyCiphertext,
            String apiKeyHint,
            String apiKeyKeyVersion,
            boolean enabled,
            long createdBy
    ) {
        Long id = jdbcTemplate.queryForObject("""
                        insert into model_config (
                            model_code, name, provider, model_type, base_url,
                            api_key_ciphertext, api_key_hint, api_key_key_version,
                            enabled, created_by, created_at, updated_at
                        )
                        values (
                            :modelCode, :name, :provider, :modelType, :baseUrl,
                            :apiKeyCiphertext, :apiKeyHint, :apiKeyKeyVersion,
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
                        .addValue("apiKeyCiphertext", apiKeyCiphertext)
                        .addValue("apiKeyHint", apiKeyHint)
                        .addValue("apiKeyKeyVersion", apiKeyKeyVersion)
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
                        select id, model_code, name, provider, model_type, base_url,
                               api_key_hint,
                               enabled, is_default, last_test_status, last_test_message, last_tested_at, created_at, updated_at
                        from model_config
                        where deleted_at is null
                        order by created_at desc
                        """,
                (rs, rowNum) -> mapModelConfig(rs));
    }

    public Optional<ModelConfig> findModelConfigById(long id) {
        return jdbcTemplate.query("""
                        select id, model_code, name, provider, model_type, base_url,
                               api_key_hint,
                               enabled, is_default, last_test_status, last_test_message, last_tested_at, created_at, updated_at
                        from model_config
                        where id = :id and deleted_at is null
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

    public Optional<RuntimeModelConfig> findRuntimeModelConfig(ModelType modelType, String modelCode) {
        return jdbcTemplate.query("""
                        select model_code, provider, model_type, base_url,
                               api_key_ciphertext,
                               api_key_key_version, enabled
                        from model_config
                        where model_type = :modelType
                          and model_code = :modelCode
                          and enabled = true
                          and deleted_at is null
                        """,
                Map.of("modelType", modelType.name(), "modelCode", modelCode),
                rs -> rs.next() ? Optional.of(new RuntimeModelConfig(
                        rs.getString("model_code"),
                        rs.getString("provider"),
                        ModelType.valueOf(rs.getString("model_type")),
                        rs.getString("base_url"),
                        rs.getString("api_key_ciphertext"),
                        rs.getString("api_key_key_version")
                )) : Optional.empty());
    }

    public Optional<RuntimeModelConfig> findDefaultRuntimeModelConfig(ModelType modelType) {
        return jdbcTemplate.query("""
                        select model_code, provider, model_type, base_url,
                               api_key_ciphertext,
                               api_key_key_version, enabled
                        from model_config
                        where model_type = :modelType
                          and enabled = true
                          and deleted_at is null
                        order by is_default desc, updated_at desc
                        limit 1
                        """,
                Map.of("modelType", modelType.name()),
                rs -> rs.next() ? Optional.of(new RuntimeModelConfig(
                        rs.getString("model_code"),
                        rs.getString("provider"),
                        ModelType.valueOf(rs.getString("model_type")),
                        rs.getString("base_url"),
                        rs.getString("api_key_ciphertext"),
                        rs.getString("api_key_key_version")
                )) : Optional.empty());
    }

    private ModelConfig mapModelConfig(ResultSet rs) throws SQLException {
        return new ModelConfig(
                rs.getLong("id"),
                rs.getString("model_code"),
                rs.getString("name"),
                rs.getString("provider"),
                ModelType.valueOf(rs.getString("model_type")),
                rs.getString("base_url"),
                rs.getString("api_key_hint"),
                rs.getBoolean("enabled"),
                rs.getBoolean("is_default"),
                rs.getString("last_test_status"),
                rs.getString("last_test_message"),
                rs.getTimestamp("last_tested_at") == null ? null : rs.getTimestamp("last_tested_at").toInstant(),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }

    public Optional<ModelConfig> findModelConfigByCode(String modelCode) {
        return jdbcTemplate.query("""
                        select id, model_code, name, provider, model_type, base_url,
                               api_key_hint,
                               enabled, is_default, last_test_status, last_test_message, last_tested_at, created_at, updated_at
                        from model_config
                        where model_code = :modelCode and deleted_at is null
                        """,
                Map.of("modelCode", modelCode),
                rs -> rs.next() ? Optional.of(mapModelConfig(rs)) : Optional.empty());
    }

    public void updateModelConfig(
            String modelCode,
            String name,
            String provider,
            ModelType modelType,
            String baseUrl,
            String apiKeyCiphertext,
            String apiKeyHint,
            String apiKeyKeyVersion,
            boolean enabled
    ) {
        jdbcTemplate.update("""
                        update model_config
                        set name = :name,
                            provider = :provider,
                            model_type = :modelType,
                            base_url = :baseUrl,
                            api_key_ciphertext = coalesce(:apiKeyCiphertext, api_key_ciphertext),
                            api_key_hint = coalesce(:apiKeyHint, api_key_hint),
                            api_key_key_version = coalesce(:apiKeyKeyVersion, api_key_key_version),
                            enabled = :enabled,
                            updated_at = now()
                        where model_code = :modelCode and deleted_at is null
                        """,
                new MapSqlParameterSource()
                        .addValue("modelCode", modelCode)
                        .addValue("name", name)
                        .addValue("provider", provider)
                        .addValue("modelType", modelType.name())
                        .addValue("baseUrl", baseUrl)
                        .addValue("apiKeyCiphertext", apiKeyCiphertext)
                        .addValue("apiKeyHint", apiKeyHint)
                        .addValue("apiKeyKeyVersion", apiKeyKeyVersion)
                        .addValue("enabled", enabled));
    }

    public void setModelEnabled(String modelCode, boolean enabled) {
        jdbcTemplate.update("""
                        update model_config
                        set enabled = :enabled,
                            updated_at = now()
                        where model_code = :modelCode and deleted_at is null
                        """,
                Map.of("modelCode", modelCode, "enabled", enabled));
    }

    public void deleteModelConfig(String modelCode) {
        jdbcTemplate.update("""
                        update model_config
                        set deleted_at = now(),
                            enabled = false,
                            is_default = false,
                            updated_at = now()
                        where model_code = :modelCode and deleted_at is null
                        """,
                Map.of("modelCode", modelCode));
    }

    public void setDefaultModel(String modelCode, ModelType modelType) {
        jdbcTemplate.update("""
                        update model_config
                        set is_default = false,
                            updated_at = now()
                        where model_type = :modelType and deleted_at is null
                        """,
                Map.of("modelType", modelType.name()));
        jdbcTemplate.update("""
                        update model_config
                        set is_default = true,
                            enabled = true,
                            updated_at = now()
                        where model_code = :modelCode and model_type = :modelType and deleted_at is null
                        """,
                Map.of("modelCode", modelCode, "modelType", modelType.name()));
    }

    public void markModelTestResult(String modelCode, String status, String message) {
        jdbcTemplate.update("""
                        update model_config
                        set last_tested_at = now(),
                            last_test_status = :status,
                            last_test_message = :message,
                            updated_at = now()
                        where model_code = :modelCode and deleted_at is null
                        """,
                new MapSqlParameterSource()
                        .addValue("modelCode", modelCode)
                        .addValue("status", status)
                        .addValue("message", message));
    }

    public record RuntimeModelConfig(
            String modelCode,
            String provider,
            ModelType modelType,
            String baseUrl,
            String apiKeyCiphertext,
            String keyVersion
    ) {
    }
}
