package com.sreehc.aiagent.application.admin;

import com.sreehc.aiagent.domain.admin.ModelType;
import com.sreehc.aiagent.infrastructure.admin.AdminSettingsRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ModelRuntimeResolver {
    private final AdminSettingsRepository adminSettingsRepository;
    private final SecretCipherService secretCipherService;

    public ModelRuntimeResolver(AdminSettingsRepository adminSettingsRepository, SecretCipherService secretCipherService) {
        this.adminSettingsRepository = adminSettingsRepository;
        this.secretCipherService = secretCipherService;
    }

    public Optional<RuntimeModel> find(ModelType modelType, String modelCode) {
        Optional<AdminSettingsRepository.RuntimeModelConfig> config = modelCode == null || modelCode.isBlank()
                ? adminSettingsRepository.findDefaultRuntimeModelConfig(modelType)
                : adminSettingsRepository.findRuntimeModelConfig(modelType, modelCode);
        return config.map(this::toRuntimeModel);
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
