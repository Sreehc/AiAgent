package com.sreehc.aiagent.application.account;

import com.sreehc.aiagent.application.admin.SecretCipherService;
import com.sreehc.aiagent.domain.admin.ModelType;
import com.sreehc.aiagent.domain.account.UserApiConfig;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.infrastructure.account.UserApiConfigRepository;
import com.sreehc.aiagent.infrastructure.account.UserApiConfigRepository.StoredUserApiConfig;
import com.sreehc.aiagent.infrastructure.knowledge.EmbeddingProviderRouter;
import com.sreehc.aiagent.infrastructure.model.ChatModelProvider;
import com.sreehc.aiagent.infrastructure.model.ChatModelProviderRouter;
import com.sreehc.aiagent.infrastructure.model.ImageGenerationProviderRouter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserApiConfigService {
    private static final UserApiConfig DEFAULT_CONFIG = new UserApiConfig(
            "https://api.openai.com/v1", null, "gpt-4o", 0.7, 2000, false
    );

    private final UserApiConfigRepository repository;
    private final SecretCipherService secretCipherService;
    private final ChatModelProviderRouter chatModelProviderRouter;
    private final EmbeddingProviderRouter embeddingProviderRouter;
    private final ImageGenerationProviderRouter imageGenerationProviderRouter;

    public UserApiConfigService(
            UserApiConfigRepository repository,
            SecretCipherService secretCipherService,
            ChatModelProviderRouter chatModelProviderRouter,
            EmbeddingProviderRouter embeddingProviderRouter,
            ImageGenerationProviderRouter imageGenerationProviderRouter
    ) {
        this.repository = repository;
        this.secretCipherService = secretCipherService;
        this.chatModelProviderRouter = chatModelProviderRouter;
        this.embeddingProviderRouter = embeddingProviderRouter;
        this.imageGenerationProviderRouter = imageGenerationProviderRouter;
    }

    public UserApiConfig get(SessionUser currentUser) {
        return repository.findByUserId(currentUser.id()).map(this::toView).orElse(DEFAULT_CONFIG);
    }

    public java.util.Optional<RuntimeUserApiConfig> findRuntimeConfig(SessionUser currentUser) {
        return repository.findByUserId(currentUser.id())
                .filter(config -> config.apiKeyCiphertext() != null && !config.apiKeyCiphertext().isBlank())
                .map(config -> new RuntimeUserApiConfig(
                        config.baseUrl(),
                        secretCipherService.decrypt(config.apiKeyCiphertext()),
                        config.model(),
                        config.temperature(),
                        config.maxTokens()
                ));
    }

    public TestResult test(SessionUser currentUser, ModelType modelType) {
        RuntimeUserApiConfig config = findRuntimeConfig(currentUser)
                .orElseThrow(() -> new IllegalStateException("Personal API config is missing an API key"));
        try {
            if (modelType == ModelType.CHAT) {
                chatModelProviderRouter.route("openai-compatible").complete(new ChatModelProvider.ChatRequest(
                        "Return ok.",
                        config.model(),
                        config.baseUrl(),
                        config.apiKey()
                ));
                return new TestResult(modelType, "SUCCESS", "Chat connection test passed");
            }
            if (modelType == ModelType.EMBEDDING) {
                embeddingProviderRouter.embed("openai-compatible", "connection test", config.model(), config.baseUrl(), config.apiKey());
                return new TestResult(modelType, "SUCCESS", "Embedding connection test passed");
            }
            if (modelType == ModelType.IMAGE) {
                imageGenerationProviderRouter.route("openai-compatible");
                return new TestResult(modelType, "SUCCESS", "Image provider route is available; generation smoke is skipped to avoid cost");
            }
            return new TestResult(modelType, "FAILED", "Unsupported model type");
        } catch (Exception exception) {
            return new TestResult(modelType, "FAILED", exception.getMessage() == null ? "Connection test failed" : exception.getMessage());
        }
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

    public record RuntimeUserApiConfig(
            String baseUrl,
            String apiKey,
            String model,
            double temperature,
            int maxTokens
    ) {
    }

    public record TestResult(
            ModelType modelType,
            String status,
            String message
    ) {
    }
}
