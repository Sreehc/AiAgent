package com.sreehc.aiagent.application.admin;

import com.sreehc.aiagent.application.account.UserApiConfigService;
import com.sreehc.aiagent.domain.admin.ModelType;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.infrastructure.admin.AdminSettingsRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ModelRuntimeResolver {
    private final AdminSettingsRepository adminSettingsRepository;
    private final SecretCipherService secretCipherService;
    private final UserApiConfigService userApiConfigService;

    public ModelRuntimeResolver(
            AdminSettingsRepository adminSettingsRepository,
            SecretCipherService secretCipherService,
            UserApiConfigService userApiConfigService
    ) {
        this.adminSettingsRepository = adminSettingsRepository;
        this.secretCipherService = secretCipherService;
        this.userApiConfigService = userApiConfigService;
    }

    public Optional<RuntimeModel> find(ModelType modelType, String modelCode) {
        Optional<AdminSettingsRepository.RuntimeModelConfig> config = modelCode == null || modelCode.isBlank()
                ? adminSettingsRepository.findDefaultRuntimeModelConfig(modelType)
                : adminSettingsRepository.findRuntimeModelConfig(modelType, modelCode);
        return config.map(this::toRuntimeModel);
    }

    public Optional<RuntimeModel> findForUser(SessionUser currentUser, ModelType modelType, String modelCode) {
        if (modelType == ModelType.CHAT || modelType == ModelType.IMAGE || modelType == ModelType.EMBEDDING) {
            Optional<UserApiConfigService.RuntimeUserApiConfig> userConfig = userApiConfigService.findRuntimeConfig(currentUser);
            if (userConfig.isPresent()) {
                UserApiConfigService.RuntimeUserApiConfig config = userConfig.get();
                return Optional.of(new RuntimeModel(
                        config.model(),
                        "openai-compatible",
                        modelType,
                        config.baseUrl(),
                        config.apiKey()
                ));
            }
        }
        return find(modelType, modelCode);
    }

    private RuntimeModel toRuntimeModel(AdminSettingsRepository.RuntimeModelConfig config) {
        return new RuntimeModel(
                config.modelCode(),
                config.provider(),
                config.modelType(),
                config.baseUrl(),
                secretCipherService.decrypt(config.apiKeyCiphertext())
        );
    }

    public record RuntimeModel(
            String modelCode,
            String provider,
            ModelType modelType,
            String baseUrl,
            String apiKey
    ) {
    }
}
