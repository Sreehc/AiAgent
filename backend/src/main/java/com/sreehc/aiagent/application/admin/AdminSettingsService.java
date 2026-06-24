package com.sreehc.aiagent.application.admin;

import com.sreehc.aiagent.application.common.AdminAuthorizationService;
import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.domain.admin.AdminInvite;
import com.sreehc.aiagent.domain.admin.ModelConfig;
import com.sreehc.aiagent.domain.admin.ModelType;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.infrastructure.admin.AdminSettingsRepository;
import com.sreehc.aiagent.infrastructure.model.ChatModelProvider;
import com.sreehc.aiagent.infrastructure.model.ChatModelProviderRouter;
import com.sreehc.aiagent.infrastructure.model.ImageGenerationProviderRouter;
import com.sreehc.aiagent.infrastructure.model.ModelProviderException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminSettingsService {
    private final AdminAuthorizationService adminAuthorizationService;
    private final AdminSettingsRepository adminSettingsRepository;
    private final SecretCipherService secretCipherService;
    private final ChatModelProviderRouter chatModelProviderRouter;
    private final ImageGenerationProviderRouter imageGenerationProviderRouter;

    public AdminSettingsService(
            AdminAuthorizationService adminAuthorizationService,
            AdminSettingsRepository adminSettingsRepository,
            SecretCipherService secretCipherService,
            ChatModelProviderRouter chatModelProviderRouter,
            ImageGenerationProviderRouter imageGenerationProviderRouter
    ) {
        this.adminAuthorizationService = adminAuthorizationService;
        this.adminSettingsRepository = adminSettingsRepository;
        this.secretCipherService = secretCipherService;
        this.chatModelProviderRouter = chatModelProviderRouter;
        this.imageGenerationProviderRouter = imageGenerationProviderRouter;
    }

    public List<ModelConfig> listModels(SessionUser currentUser) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return adminSettingsRepository.listModelConfigs();
    }

    @Transactional
    public ModelConfig createModel(SessionUser currentUser, CreateModelCommand command) {
        adminAuthorizationService.ensureAdmin(currentUser);
        validateModelCommand(command);
        String encryptedApiKey = secretCipherService.encrypt(command.apiKey());
        long id = adminSettingsRepository.createModelConfig(
                command.modelCode(),
                command.name(),
                command.provider(),
                command.modelType(),
                command.baseUrl(),
                encryptedApiKey,
                maskApiKey(command.apiKey()),
                secretCipherService.keyVersion(),
                command.enabled(),
                currentUser.id()
        );
        return adminSettingsRepository.findModelConfigById(id)
                .orElseThrow(() -> new IllegalStateException("Failed to load created model config"));
    }

    @Transactional
    public ModelConfig updateModel(SessionUser currentUser, String modelCode, UpdateModelCommand command) {
        adminAuthorizationService.ensureAdmin(currentUser);
        ModelConfig existing = ensureModelExists(modelCode);
        if (isBlank(command.provider()) || command.modelType() == null) {
            throw new AppException("PARAM_INVALID", "Provider and model type are required", HttpStatus.BAD_REQUEST);
        }
        if (!"local-mock".equalsIgnoreCase(command.provider())
                && isBlank(command.baseUrl())) {
            throw new AppException("PARAM_INVALID", "Non-mock model providers require baseUrl", HttpStatus.BAD_REQUEST);
        }
        if (!"local-mock".equalsIgnoreCase(command.provider())
                && isBlank(command.apiKey())
                && isBlank(existing.apiKeyMasked())) {
            throw new AppException("PARAM_INVALID", "Non-mock model providers require apiKey", HttpStatus.BAD_REQUEST);
        }
        String encryptedApiKey = isBlank(command.apiKey()) ? null : secretCipherService.encrypt(command.apiKey());
        adminSettingsRepository.updateModelConfig(
                modelCode,
                command.name(),
                command.provider(),
                command.modelType(),
                command.baseUrl(),
                encryptedApiKey,
                isBlank(command.apiKey()) ? null : maskApiKey(command.apiKey()),
                isBlank(command.apiKey()) ? null : secretCipherService.keyVersion(),
                command.enabled()
        );
        return adminSettingsRepository.findModelConfigByCode(modelCode)
                .orElseThrow(() -> new AppException("MODEL_NOT_FOUND", "Model config not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public ModelConfig setModelEnabled(SessionUser currentUser, String modelCode, boolean enabled) {
        adminAuthorizationService.ensureAdmin(currentUser);
        ensureModelExists(modelCode);
        adminSettingsRepository.setModelEnabled(modelCode, enabled);
        return adminSettingsRepository.findModelConfigByCode(modelCode)
                .orElseThrow(() -> new AppException("MODEL_NOT_FOUND", "Model config not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public void deleteModel(SessionUser currentUser, String modelCode) {
        adminAuthorizationService.ensureAdmin(currentUser);
        ModelConfig model = ensureModelExists(modelCode);
        if (model.defaultModel()) {
            throw new AppException("MODEL_DEFAULT_DELETE_DENIED", "Default model cannot be deleted", HttpStatus.CONFLICT);
        }
        adminSettingsRepository.deleteModelConfig(modelCode);
    }

    @Transactional
    public ModelConfig setDefaultModel(SessionUser currentUser, String modelCode) {
        adminAuthorizationService.ensureAdmin(currentUser);
        ModelConfig model = ensureModelExists(modelCode);
        adminSettingsRepository.setDefaultModel(modelCode, model.modelType());
        return adminSettingsRepository.findModelConfigByCode(modelCode)
                .orElseThrow(() -> new AppException("MODEL_NOT_FOUND", "Model config not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public ModelTestResult testModel(SessionUser currentUser, String modelCode) {
        adminAuthorizationService.ensureAdmin(currentUser);
        AdminSettingsRepository.RuntimeModelConfig runtime = adminSettingsRepository.findRuntimeModelConfig(
                        ensureModelExists(modelCode).modelType(),
                        modelCode
                )
                .orElseThrow(() -> new AppException("MODEL_NOT_ENABLED", "Only enabled models can be tested", HttpStatus.CONFLICT));
        String status = "SUCCESS";
        String message = "Connection test passed";
        try {
            if ("local-mock".equalsIgnoreCase(runtime.provider())) {
                message = "local-mock provider is available";
            } else if (runtime.modelType() == ModelType.CHAT) {
                ChatModelProvider provider = chatModelProviderRouter.route(runtime.provider());
                provider.complete(new ChatModelProvider.ChatRequest(
                        "Return ok.",
                        runtime.modelCode(),
                        runtime.baseUrl(),
                        secretCipherService.decrypt(runtime.apiKeyCiphertext())
                ));
            } else if (runtime.modelType() == ModelType.IMAGE) {
                imageGenerationProviderRouter.route(runtime.provider());
                message = "Image provider route is available; generation smoke is skipped to avoid cost";
            } else {
                message = "Embedding provider route is managed by RAG runtime; direct smoke is skipped";
            }
        } catch (Exception exception) {
            status = "FAILED";
            message = exception instanceof ModelProviderException ? exception.getMessage() : "Connection test failed";
        }
        adminSettingsRepository.markModelTestResult(modelCode, status, message);
        return new ModelTestResult(modelCode, status, message);
    }

    @Transactional
    public AdminInvite createInvite(SessionUser currentUser, CreateInviteCommand command) {
        adminAuthorizationService.ensureAdmin(currentUser);
        Instant expiresAt = Instant.now().plus(Math.max(1, command.expiresInDays()), ChronoUnit.DAYS);
        String inviteToken = "INVITE-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        adminSettingsRepository.createInvite(inviteToken, currentUser.id(), expiresAt);
        return adminSettingsRepository.listInvites(1).stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Failed to load created invite"));
    }

    public List<AdminInvite> listInvites(SessionUser currentUser, int limit) {
        adminAuthorizationService.ensureAdmin(currentUser);
        return adminSettingsRepository.listInvites(Math.max(1, limit));
    }

    private void validateModelCommand(CreateModelCommand command) {
        if (isBlank(command.modelCode()) || isBlank(command.provider()) || command.modelType() == null) {
            throw new AppException("PARAM_INVALID", "Model code, provider, and model type are required", HttpStatus.BAD_REQUEST);
        }
        if (!"local-mock".equalsIgnoreCase(command.provider())
                && (isBlank(command.baseUrl()) || isBlank(command.apiKey()))) {
            throw new AppException("PARAM_INVALID", "Non-mock model providers require baseUrl and apiKey", HttpStatus.BAD_REQUEST);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private ModelConfig ensureModelExists(String modelCode) {
        return adminSettingsRepository.findModelConfigByCode(modelCode)
                .orElseThrow(() -> new AppException("MODEL_NOT_FOUND", "Model config not found", HttpStatus.NOT_FOUND));
    }

    public static ModelRisk evaluateModelRisk(ModelConfig modelConfig) {
        List<String> riskCodes = new ArrayList<>();
        List<String> riskReasons = new ArrayList<>();
        String riskLevel = "default";
        if (modelConfig.enabled() && "local-mock".equalsIgnoreCase(modelConfig.provider())) {
            riskCodes.add("LOCAL_MOCK_ENABLED");
            riskReasons.add("启用模型使用 local-mock provider");
            riskLevel = "danger";
        }
        if (modelConfig.enabled()
                && modelConfig.lastTestStatus() != null
                && !"SUCCESS".equalsIgnoreCase(modelConfig.lastTestStatus())) {
            riskCodes.add("LAST_TEST_FAILED");
            riskReasons.add("最近连接测试非 SUCCESS");
            if (!"danger".equals(riskLevel)) {
                riskLevel = "warning";
            }
        }
        return new ModelRisk(riskLevel, riskCodes, riskReasons);
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

    public record CreateModelCommand(
            String modelCode,
            String name,
            String provider,
            ModelType modelType,
            String baseUrl,
            String apiKey,
            boolean enabled
    ) {
    }

    public record UpdateModelCommand(
            String name,
            String provider,
            ModelType modelType,
            String baseUrl,
            String apiKey,
            boolean enabled
    ) {
    }

    public record ModelTestResult(
            String modelCode,
            String status,
            String message
    ) {
    }

    public record ModelRisk(
            String riskLevel,
            List<String> riskCodes,
            List<String> riskReasons
    ) {
    }

    public record CreateInviteCommand(
            int expiresInDays
    ) {
    }
}
