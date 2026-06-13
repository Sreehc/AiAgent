package com.sreehc.aiagent.infrastructure.account;

import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UserApiConfigRepository {
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public UserApiConfigRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<StoredUserApiConfig> findByUserId(long userId) {
        return jdbcTemplate.query("""
                        select base_url, api_key_ciphertext, api_key_hint, api_key_key_version,
                               model_code, temperature, max_tokens
                        from user_api_config
                        where user_id = :userId
                        """,
                Map.of("userId", userId),
                rs -> rs.next() ? Optional.of(new StoredUserApiConfig(
                        rs.getString("base_url"),
                        rs.getString("api_key_ciphertext"),
                        rs.getString("api_key_hint"),
                        rs.getString("api_key_key_version"),
                        rs.getString("model_code"),
                        rs.getDouble("temperature"),
                        rs.getInt("max_tokens")
                )) : Optional.empty());
    }

    public void upsert(
            long userId,
            String baseUrl,
            String apiKeyCiphertext,
            String apiKeyHint,
            String apiKeyKeyVersion,
            String model,
            double temperature,
            int maxTokens
    ) {
        jdbcTemplate.update("""
                        insert into user_api_config (
                            user_id, base_url, api_key_ciphertext, api_key_hint, api_key_key_version,
                            model_code, temperature, max_tokens, created_at, updated_at
                        )
                        values (
                            :userId, :baseUrl, :apiKeyCiphertext, :apiKeyHint, :apiKeyKeyVersion,
                            :model, :temperature, :maxTokens, now(), now()
                        )
                        on conflict (user_id) do update
                        set base_url = excluded.base_url,
                            api_key_ciphertext = excluded.api_key_ciphertext,
                            api_key_hint = excluded.api_key_hint,
                            api_key_key_version = excluded.api_key_key_version,
                            model_code = excluded.model_code,
                            temperature = excluded.temperature,
                            max_tokens = excluded.max_tokens,
                            updated_at = now()
                        """,
                new MapSqlParameterSource()
                        .addValue("userId", userId)
                        .addValue("baseUrl", baseUrl)
                        .addValue("apiKeyCiphertext", apiKeyCiphertext)
                        .addValue("apiKeyHint", apiKeyHint)
                        .addValue("apiKeyKeyVersion", apiKeyKeyVersion)
                        .addValue("model", model)
                        .addValue("temperature", temperature)
                        .addValue("maxTokens", maxTokens));
    }

    public record StoredUserApiConfig(
            String baseUrl,
            String apiKeyCiphertext,
            String apiKeyHint,
            String apiKeyKeyVersion,
            String model,
            double temperature,
            int maxTokens
    ) {
    }
}
