package com.sreehc.aiagent.trigger.admin;

import com.sreehc.aiagent.application.admin.AdminSettingsService;
import com.sreehc.aiagent.domain.admin.AdminInvite;
import com.sreehc.aiagent.domain.admin.ModelConfig;
import com.sreehc.aiagent.domain.admin.ModelType;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.trigger.ApiResponse;
import com.sreehc.aiagent.trigger.AuthFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1/admin")
public class AdminSettingsController {
    private final AdminSettingsService adminSettingsService;

    public AdminSettingsController(AdminSettingsService adminSettingsService) {
        this.adminSettingsService = adminSettingsService;
    }

    @GetMapping("/models")
    public ApiResponse<List<ModelConfigResponse>> listModels(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser
    ) {
        return ApiResponse.success(adminSettingsService.listModels(currentUser).stream()
                .map(this::toModelConfigResponse)
                .toList());
    }

    @PostMapping("/models")
    public ApiResponse<ModelConfigResponse> createModel(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @Valid @RequestBody CreateModelRequest request
    ) {
        return ApiResponse.success(toModelConfigResponse(adminSettingsService.createModel(
                currentUser,
                new AdminSettingsService.CreateModelCommand(
                        request.modelCode(),
                        request.name(),
                        request.provider(),
                        request.modelType(),
                        request.baseUrl(),
                        request.apiKey(),
                        request.enabled()
                )
        )));
    }

    @PutMapping("/models/{modelCode}")
    public ApiResponse<ModelConfigResponse> updateModel(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String modelCode,
            @Valid @RequestBody UpdateModelRequest request
    ) {
        return ApiResponse.success(toModelConfigResponse(adminSettingsService.updateModel(
                currentUser,
                modelCode,
                new AdminSettingsService.UpdateModelCommand(
                        request.name(),
                        request.provider(),
                        request.modelType(),
                        request.baseUrl(),
                        request.apiKey(),
                        request.enabled()
                )
        )));
    }

    @PostMapping("/models/{modelCode}/enable")
    public ApiResponse<ModelConfigResponse> enableModel(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String modelCode
    ) {
        return ApiResponse.success(toModelConfigResponse(adminSettingsService.setModelEnabled(currentUser, modelCode, true)));
    }

    @PostMapping("/models/{modelCode}/disable")
    public ApiResponse<ModelConfigResponse> disableModel(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String modelCode
    ) {
        return ApiResponse.success(toModelConfigResponse(adminSettingsService.setModelEnabled(currentUser, modelCode, false)));
    }

    @DeleteMapping("/models/{modelCode}")
    public ApiResponse<Void> deleteModel(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String modelCode
    ) {
        adminSettingsService.deleteModel(currentUser, modelCode);
        return ApiResponse.success(null);
    }

    @PostMapping("/models/{modelCode}/default")
    public ApiResponse<ModelConfigResponse> setDefaultModel(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String modelCode
    ) {
        return ApiResponse.success(toModelConfigResponse(adminSettingsService.setDefaultModel(currentUser, modelCode)));
    }

    @PostMapping("/models/{modelCode}/test")
    public ApiResponse<ModelTestResponse> testModel(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable String modelCode
    ) {
        AdminSettingsService.ModelTestResult result = adminSettingsService.testModel(currentUser, modelCode);
        return ApiResponse.success(new ModelTestResponse(result.modelCode(), result.status(), result.message()));
    }

    @GetMapping("/invites")
    public ApiResponse<List<InviteResponse>> listInvites(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int limit
    ) {
        return ApiResponse.success(adminSettingsService.listInvites(currentUser, limit).stream()
                .map(this::toInviteResponse)
                .toList());
    }

    @PostMapping("/invites")
    public ApiResponse<InviteResponse> createInvite(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @Valid @RequestBody CreateInviteRequest request
    ) {
        return ApiResponse.success(toInviteResponse(adminSettingsService.createInvite(
                currentUser,
                new AdminSettingsService.CreateInviteCommand(request.expiresInDays())
        )));
    }

    private ModelConfigResponse toModelConfigResponse(ModelConfig modelConfig) {
        return new ModelConfigResponse(
                modelConfig.id(),
                modelConfig.modelCode(),
                modelConfig.name(),
                modelConfig.provider(),
                modelConfig.modelType().name(),
                modelConfig.baseUrl(),
                modelConfig.apiKeyMasked(),
                modelConfig.enabled(),
                modelConfig.defaultModel(),
                modelConfig.lastTestStatus(),
                modelConfig.lastTestMessage(),
                modelConfig.lastTestedAt() == null ? null : modelConfig.lastTestedAt().toString(),
                modelConfig.createdAt().toString(),
                modelConfig.updatedAt().toString()
        );
    }

    private InviteResponse toInviteResponse(AdminInvite invite) {
        return new InviteResponse(
                invite.inviteToken(),
                invite.status(),
                invite.expiresAt().toString(),
                invite.createdAt().toString()
        );
    }

    public record CreateModelRequest(
            @NotBlank @Size(max = 64) String modelCode,
            @NotBlank @Size(max = 128) String name,
            @NotBlank @Size(max = 64) String provider,
            @NotNull ModelType modelType,
            @Size(max = 512) String baseUrl,
            @Size(max = 255) String apiKey,
            boolean enabled
    ) {
    }

    public record UpdateModelRequest(
            @NotBlank @Size(max = 128) String name,
            @NotBlank @Size(max = 64) String provider,
            @NotNull ModelType modelType,
            @Size(max = 512) String baseUrl,
            @Size(max = 255) String apiKey,
            boolean enabled
    ) {
    }

    public record CreateInviteRequest(
            @Min(1) @Max(365) int expiresInDays
    ) {
    }

    public record ModelConfigResponse(
            long id,
            String modelCode,
            String name,
            String provider,
            String modelType,
            String baseUrl,
            String apiKeyMasked,
            boolean enabled,
            boolean defaultModel,
            String lastTestStatus,
            String lastTestMessage,
            String lastTestedAt,
            String createdAt,
            String updatedAt
    ) {
    }

    public record ModelTestResponse(
            String modelCode,
            String status,
            String message
    ) {
    }

    public record InviteResponse(
            String inviteToken,
            String status,
            String expiresAt,
            String createdAt
    ) {
    }
}
