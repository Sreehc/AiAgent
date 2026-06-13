package com.sreehc.aiagent.application.account;

import com.sreehc.aiagent.application.admin.SecretCipherService;
import com.sreehc.aiagent.domain.account.UserApiConfig;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.infrastructure.account.UserApiConfigRepository;
import com.sreehc.aiagent.infrastructure.account.UserApiConfigRepository.StoredUserApiConfig;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserApiConfigService {
    private static final UserApiConfig DEFAULT_CONFIG = new UserApiConfig(
            "https://api.openai.com/v1", null, "gpt-4o", 0.7, 2000, false
    );

    private final UserApiConfigRepository repository;
    private final SecretCipherService secretCipherService;

    public UserApiConfigService(UserApiConfigRepository repository, SecretCipherService secretCipherService) {
        this.repository = repository;
        this.secretCipherService = secretCipherService;
    }

    public UserApiConfig get(SessionUser currentUser) {
        return repository.findByUserId(currentUser.id()).map(this::toView).orElse(DEFAULT_CONFIG);
    }

    @Transactional
    public UserApiConfig update(SessionUser currentUser, UpdateCommand command) {
        StoredUserApiConfig existing = repository.findByUserId(currentUser.id()).orElse(null);
        boolean replacingKey = command.apiKey() != null && !command.apiKey().isBlank();
        String ciphertext = replacingKey
                ? secretCipherService.encrypt(command.apiKey())
                : existing == null ? null : existing.apiKeyCiphertext();
        String hint = replacingKey
                ? maskApiKey(command.apiKey())
                : existing == null ? null : existing.apiKeyHint();
        String keyVersion = replacingKey
                ? secretCipherService.keyVersion()
                : existing == null ? secretCipherService.keyVersion() : existing.apiKeyKeyVersion();
        repository.upsert(
                currentUser.id(),
                command.baseUrl(),
                ciphertext,
                hint,
                keyVersion,
                command.model(),
                command.temperature(),
                command.maxTokens()
        );
        return get(currentUser);
    }

    private UserApiConfig toView(StoredUserApiConfig config) {
        return new UserApiConfig(
                config.baseUrl(),
                config.apiKeyHint(),
                config.model(),
                config.temperature(),
                config.maxTokens(),
                config.apiKeyCiphertext() != null && !config.apiKeyCiphertext().isBlank()
        );
    }

    private String maskApiKey(String apiKey) {
        if (apiKey.length() <= 8) {
            return "****";
        }
        return apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length() - 4);
    }

    public record UpdateCommand(
            String baseUrl,
            String apiKey,
            String model,
            double temperature,
            int maxTokens
    ) {
    }
}
