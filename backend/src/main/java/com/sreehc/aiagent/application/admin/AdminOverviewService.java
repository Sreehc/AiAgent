package com.sreehc.aiagent.application.admin;

import com.sreehc.aiagent.application.common.AdminAuthorizationService;
import com.sreehc.aiagent.domain.admin.ModelConfig;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.mcp.McpServerConfig;
import com.sreehc.aiagent.domain.mcp.McpServerStatus;
import com.sreehc.aiagent.infrastructure.admin.AdminSettingsRepository;
import com.sreehc.aiagent.infrastructure.mcp.McpServerRepository;
import java.util.List;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AdminOverviewService {
    private final AdminAuthorizationService adminAuthorizationService;
    private final AdminSettingsRepository adminSettingsRepository;
    private final McpServerRepository mcpServerRepository;
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AdminOverviewService(
            AdminAuthorizationService adminAuthorizationService,
            AdminSettingsRepository adminSettingsRepository,
            McpServerRepository mcpServerRepository,
            NamedParameterJdbcTemplate jdbcTemplate
    ) {
        this.adminAuthorizationService = adminAuthorizationService;
        this.adminSettingsRepository = adminSettingsRepository;
        this.mcpServerRepository = mcpServerRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public Overview overview(SessionUser currentUser) {
        adminAuthorizationService.ensureAdmin(currentUser);
        List<ModelConfig> models = adminSettingsRepository.listModelConfigs();
        List<McpServerConfig> mcpServers = mcpServerRepository.listServers();
        ModelConfig defaultModel = models.stream().filter(ModelConfig::defaultModel).findFirst().orElse(null);
        int riskyModels = (int) models.stream()
                .map(AdminSettingsService::evaluateModelRisk)
                .filter(risk -> !"default".equals(risk.riskLevel()))
                .count();
        boolean missingDefaultModel = defaultModel == null && !models.isEmpty();
        int missingDefaultRisk = missingDefaultModel ? 1 : 0;
        int activeMcp = (int) mcpServers.stream().filter(server -> server.status() == McpServerStatus.ACTIVE).count();
        int inactiveMcp = mcpServers.size() - activeMcp;
        long failedRuns = count("""
                select count(1)
                from execution_run
                where status in ('FAILED', 'TIMED_OUT', 'CANCELLED')
                """);
        long failedLogins = count("""
                select count(1)
                from login_log
                where login_result = 'FAILED'
                """);
        long ragFailures = count("""
                select count(1)
                from rag_evaluation_run
                where user_id = :userId
                  and (status ilike '%FAIL%' or status = 'ERROR' or error_message is not null)
                """, currentUser.id());
        long auditFailures = failedRuns + failedLogins;
        long totalRisks = riskyModels + missingDefaultRisk + inactiveMcp + auditFailures + ragFailures;

        return new Overview(
                models.stream().filter(ModelConfig::enabled).count(),
                models.size(),
                defaultModel == null ? null : new ModelReference(defaultModel.modelCode(), defaultModel.name(), defaultModel.provider()),
                riskyModels + missingDefaultRisk,
                activeMcp,
                mcpServers.size(),
                inactiveMcp,
                auditFailures,
                failedRuns,
                failedLogins,
                ragFailures,
                totalRisks,
                !models.isEmpty() || !mcpServers.isEmpty() || auditFailures > 0 || ragFailures > 0,
                List.of(
                        risk(
                                "models",
                                riskyModels > 0 ? "模型配置存在风险" : missingDefaultModel ? "默认模型未设置" : "模型配置正常",
                                riskyModels > 0
                                        ? riskyModels + " 个启用模型存在 provider 或连接测试风险。"
                                        : missingDefaultModel
                                            ? "建议设置默认模型，避免运行时选择不明确。"
                                            : defaultModel == null ? "尚未配置模型。" : "默认模型为 " + defaultModel.name() + "。",
                                riskyModels > 0 || missingDefaultModel,
                                riskyModels > 0 || missingDefaultModel ? "需关注" : "正常",
                                "warning"
                        ),
                        risk(
                                "mcp",
                                inactiveMcp > 0 ? "MCP 服务未激活" : "MCP 服务状态正常",
                                inactiveMcp > 0 ? inactiveMcp + " 个 MCP 服务处于非 ACTIVE 状态。" : activeMcp + " 个 MCP 服务可用。",
                                inactiveMcp > 0,
                                inactiveMcp > 0 ? "需处理" : "正常",
                                "warning"
                        ),
                        risk(
                                "audit",
                                auditFailures > 0 ? "近期审计存在失败记录" : "近期审计无失败样本",
                                auditFailures > 0 ? failedRuns + " 个任务失败，" + failedLogins + " 次登录失败。" : "当前抽样范围内没有失败记录。",
                                auditFailures > 0,
                                auditFailures > 0 ? "高优先级" : "正常",
                                "danger"
                        ),
                        risk(
                                "rag",
                                ragFailures > 0 ? "RAG 评估存在失败" : "RAG 评估无失败样本",
                                ragFailures > 0 ? ragFailures + " 条评估失败或包含错误信息。" : "当前评估历史未发现失败状态。",
                                ragFailures > 0,
                                ragFailures > 0 ? "高优先级" : "正常",
                                "danger"
                        )
                )
        );
    }

    private long count(String sql) {
        Long value = jdbcTemplate.queryForObject(sql, java.util.Map.of(), Long.class);
        return value == null ? 0 : value;
    }

    private long count(String sql, long userId) {
        Long value = jdbcTemplate.queryForObject(sql, java.util.Map.of("userId", userId), Long.class);
        return value == null ? 0 : value;
    }

    private RiskItem risk(String id, String title, String description, boolean risky, String badge, String riskTone) {
        return new RiskItem(id, title, description, badge, risky ? riskTone : "success");
    }

    public record Overview(
            long enabledModels,
            long totalModels,
            ModelReference defaultModel,
            long modelRisks,
            long activeMcp,
            long totalMcp,
            long mcpRisks,
            long auditFailures,
            long failedRuns,
            long failedLogins,
            long ragFailures,
            long totalRisks,
            boolean hasAnyData,
            List<RiskItem> risks
    ) {
    }

    public record ModelReference(
            String modelCode,
            String name,
            String provider
    ) {
    }

    public record RiskItem(
            String id,
            String title,
            String description,
            String badge,
            String tone
    ) {
    }
}
