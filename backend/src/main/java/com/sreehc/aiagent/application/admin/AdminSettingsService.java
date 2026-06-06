package com.sreehc.aiagent.application.admin;

import com.sreehc.aiagent.application.common.AdminAuthorizationService;
import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.domain.admin.AdminInvite;
import com.sreehc.aiagent.domain.admin.ModelConfig;
import com.sreehc.aiagent.domain.admin.ModelType;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.infrastructure.admin.AdminSettingsRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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

    public AdminSettingsService(
            AdminAuthorizationService adminAuthorizationService,
            AdminSettingsRepository adminSettingsRepository,
            SecretCipherService secretCipherService
    ) {
        this.adminAuthorizationService = adminAuthorizationService;
        this.adminSettingsRepository = adminSettingsRepository;
        this.secretCipherService = secretCipherService;
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

    public record CreateInviteCommand(
            int expiresInDays
    ) {
    }
}
