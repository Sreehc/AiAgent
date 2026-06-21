package com.sreehc.aiagent.application.admin;

import static org.assertj.core.api.Assertions.assertThat;

import com.sreehc.aiagent.domain.admin.ModelConfig;
import com.sreehc.aiagent.domain.admin.ModelType;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class AdminSettingsRiskTest {
    @Test
    void modelRiskMarksEnabledLocalMockAsDanger() {
        AdminSettingsService.ModelRisk risk = AdminSettingsService.evaluateModelRisk(model(
                "local-mock",
                true,
                false,
                null
        ));

        assertThat(risk.riskLevel()).isEqualTo("danger");
        assertThat(risk.riskCodes()).contains("LOCAL_MOCK_ENABLED");
        assertThat(risk.riskReasons()).contains("启用模型使用 local-mock provider");
    }

    @Test
    void modelRiskMarksFailedTestAsWarning() {
        AdminSettingsService.ModelRisk risk = AdminSettingsService.evaluateModelRisk(model(
                "openai-compatible",
                true,
                false,
                "FAILED"
        ));

        assertThat(risk.riskLevel()).isEqualTo("warning");
        assertThat(risk.riskCodes()).contains("LAST_TEST_FAILED");
        assertThat(risk.riskReasons()).contains("最近连接测试非 SUCCESS");
    }

    private ModelConfig model(String provider, boolean enabled, boolean defaultModel, String lastTestStatus) {
        Instant now = Instant.parse("2026-06-21T00:00:00Z");
        return new ModelConfig(
                1L,
                "model-code",
                "Model",
                provider,
                ModelType.CHAT,
                "https://example.com/v1",
                "sk-****",
                enabled,
                defaultModel,
                lastTestStatus,
                null,
                null,
                now,
                now
        );
    }
}
