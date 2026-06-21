package com.sreehc.aiagent.application.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.sreehc.aiagent.application.common.AdminAuthorizationService;
import com.sreehc.aiagent.domain.account.UserRole;
import com.sreehc.aiagent.domain.admin.ModelConfig;
import com.sreehc.aiagent.domain.admin.ModelType;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.infrastructure.admin.AdminSettingsRepository;
import com.sreehc.aiagent.infrastructure.mcp.McpServerRepository;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

class AdminOverviewServiceTest {
    private static final SessionUser ADMIN = new SessionUser(1L, "admin", "Admin", List.of(UserRole.ADMIN));

    private final AdminAuthorizationService adminAuthorizationService = mock(AdminAuthorizationService.class);
    private final AdminSettingsRepository adminSettingsRepository = mock(AdminSettingsRepository.class);
    private final McpServerRepository mcpServerRepository = mock(McpServerRepository.class);
    private final NamedParameterJdbcTemplate jdbcTemplate = mock(NamedParameterJdbcTemplate.class);
    private final AdminOverviewService service = new AdminOverviewService(
            adminAuthorizationService,
            adminSettingsRepository,
            mcpServerRepository,
            jdbcTemplate
    );

    @Test
    void noModelsDoesNotReportMissingDefaultModelAsRisk() {
        when(adminSettingsRepository.listModelConfigs()).thenReturn(List.of());
        when(mcpServerRepository.listServers()).thenReturn(List.of());
        when(jdbcTemplate.queryForObject(anyString(), anyMap(), eq(Long.class))).thenReturn(0L);

        AdminOverviewService.Overview overview = service.overview(ADMIN);

        assertThat(overview.modelRisks()).isZero();
        assertThat(overview.totalRisks()).isZero();
        assertThat(overview.hasAnyData()).isFalse();
        assertThat(overview.risks())
                .filteredOn(risk -> "models".equals(risk.id()))
                .singleElement()
                .satisfies(risk -> {
                    assertThat(risk.badge()).isEqualTo("正常");
                    assertThat(risk.tone()).isEqualTo("success");
                    assertThat(risk.description()).isEqualTo("尚未配置模型。");
                });
    }

    @Test
    void configuredModelsWithoutDefaultModelAreCountedAsRisk() {
        when(adminSettingsRepository.listModelConfigs()).thenReturn(List.of(model(false)));
        when(mcpServerRepository.listServers()).thenReturn(List.of());
        when(jdbcTemplate.queryForObject(anyString(), anyMap(), eq(Long.class))).thenReturn(0L);

        AdminOverviewService.Overview overview = service.overview(ADMIN);

        assertThat(overview.modelRisks()).isEqualTo(1);
        assertThat(overview.totalRisks()).isEqualTo(1);
        assertThat(overview.risks())
                .filteredOn(risk -> "models".equals(risk.id()))
                .singleElement()
                .satisfies(risk -> {
                    assertThat(risk.title()).isEqualTo("默认模型未设置");
                    assertThat(risk.badge()).isEqualTo("需关注");
                    assertThat(risk.tone()).isEqualTo("warning");
                });
    }

    private ModelConfig model(boolean defaultModel) {
        Instant now = Instant.parse("2026-06-21T00:00:00Z");
        return new ModelConfig(
                1L,
                "model-code",
                "Model",
                "openai-compatible",
                ModelType.CHAT,
                "https://example.com/v1",
                "sk-****",
                true,
                defaultModel,
                "SUCCESS",
                null,
                now,
                now,
                now
        );
    }
}
