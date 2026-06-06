package com.sreehc.aiagent.application.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.application.knowledge.KnowledgeBaseService;
import com.sreehc.aiagent.application.mcp.McpExecutionService;
import com.sreehc.aiagent.application.admin.ModelRuntimeResolver;
import com.sreehc.aiagent.app.AppProperties;
import com.sreehc.aiagent.domain.admin.ModelType;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.knowledge.SearchHit;
import com.sreehc.aiagent.domain.session.AgentMode;
import com.sreehc.aiagent.domain.session.AgentSession;
import com.sreehc.aiagent.domain.session.ArtifactType;
import com.sreehc.aiagent.domain.session.ExecutionRun;
import com.sreehc.aiagent.domain.session.PlanStepStatus;
import com.sreehc.aiagent.domain.session.SessionStatus;
import com.sreehc.aiagent.infrastructure.model.ChatModelProvider;
import com.sreehc.aiagent.infrastructure.model.ChatModelProviderRouter;
import com.sreehc.aiagent.infrastructure.session.SessionRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class SessionRunExecutor {
    private final SessionRepository sessionRepository;
    private final KnowledgeBaseService knowledgeBaseService;
    private final McpExecutionService mcpExecutionService;
    private final ObjectMapper objectMapper;
    private final ChatModelProviderRouter chatModelProviderRouter;
    private final ModelRuntimeResolver modelRuntimeResolver;
    private final AppProperties appProperties;
    private final ThreadPoolTaskExecutor executor;

    public SessionRunExecutor(
            SessionRepository sessionRepository,
            KnowledgeBaseService knowledgeBaseService,
            McpExecutionService mcpExecutionService,
            ObjectMapper objectMapper,
            ChatModelProviderRouter chatModelProviderRouter,
            ModelRuntimeResolver modelRuntimeResolver,
            AppProperties appProperties
    ) {
        this.sessionRepository = sessionRepository;
        this.knowledgeBaseService = knowledgeBaseService;
        this.mcpExecutionService = mcpExecutionService;
        this.objectMapper = objectMapper;
        this.chatModelProviderRouter = chatModelProviderRouter;
        this.modelRuntimeResolver = modelRuntimeResolver;
        this.appProperties = appProperties;
        this.executor = new ThreadPoolTaskExecutor();
        this.executor.setThreadNamePrefix("aiagent-session-run-");
        this.executor.setCorePoolSize(2);
        this.executor.setMaxPoolSize(4);
        this.executor.setQueueCapacity(32);
        this.executor.initialize();
    }

    public void submit(SessionUser currentUser, AgentSession session, SessionService.CreateRunCommand command, SseEmitter emitter) {
        executor.execute(() -> executeStream(currentUser, session, command, emitter));
    }

    void executeStream(SessionUser currentUser, AgentSession session, SessionService.CreateRunCommand command, SseEmitter emitter) {
        List<String> effectiveKnowledgeBaseIds = resolveKnowledgeBaseIds(session, command.knowledgeBaseIds());
        SessionService.CreateRunCommand effectiveCommand = new SessionService.CreateRunCommand(
                command.query(),
                command.executionMode(),
                effectiveKnowledgeBaseIds
        );
        ExecutionRun run = getOrCreatePendingRun(currentUser, session, effectiveCommand);

        try {
            sessionRepository.markSessionStatus(session.id(), SessionStatus.RUNNING);
            if (!sessionRepository.markRunStarted(run.id())) {
                throw new AppException("RUN_ALREADY_RUNNING", "Run is already running", HttpStatus.CONFLICT);
            }
            sessionRepository.createMessage(nextCode("msg"), session.id(), run.id(), "USER", effectiveCommand.query());
            trySend(emitter, "session.started", Map.of(
                    "sessionId", session.sessionCode(),
                    "runId", run.runCode(),
                    "executionMode", effectiveCommand.executionMode().name(),
                    "knowledgeBaseIds", effectiveKnowledgeBaseIds,
                    "startedAt", Instant.now().toString()
            ));

            KnowledgeBaseService.SearchResult searchResult = knowledgeBaseService.searchAcrossKnowledgeBasesWithAudit(
                    currentUser,
                    effectiveKnowledgeBaseIds,
                    effectiveCommand.query(),
                    3
            );
            sessionRepository.updateRunRetrievalAudit(
                    run.id(),
                    searchResult.retrievalQuery(),
                    toJson(searchResult.recallHits()),
                    toJson(searchResult.finalEvidenceHits())
            );
            List<SearchHit> evidenceHits = searchResult.finalEvidenceHits();
            List<PlanSeed> plan = buildPlan(effectiveCommand, evidenceHits);
            for (PlanSeed step : plan) {
                sessionRepository.createPlanStep(run.id(), nextCode("step"), step.stepNo(), step.title(), PlanStepStatus.PENDING);
            }

            trySend(emitter, "plan.generated", Map.of(
                    "sessionId", session.sessionCode(),
                    "runId", run.runCode(),
                    "plannerRound", 1,
                    "plan", plan.stream().map(step -> Map.of("stepNo", step.stepNo(), "title", step.title())).toList()
            ));

            for (PlanSeed step : plan) {
                sessionRepository.markPlanStepRunning(run.id(), step.stepNo(), step.toolName(), step.toolInput());
                McpExecutionService.InvocationResult invocationResult = mcpExecutionService.invokeForStep(
                        run.id(),
                        step.toolName(),
                        step.title(),
                        step.toolInput()
                );
                trySend(emitter, "task.started", Map.of(
                        "sessionId", session.sessionCode(),
                        "runId", run.runCode(),
                        "stepNo", step.stepNo(),
                        "title", step.title()
                ));
                trySend(emitter, "tool.called", Map.of(
                        "sessionId", session.sessionCode(),
                        "runId", run.runCode(),
                        "stepNo", step.stepNo(),
                        "toolName", invocationResult == null ? step.toolName() : invocationResult.toolName(),
                        "toolType", invocationResult == null ? "BUILTIN" : invocationResult.toolType(),
                        "toolCallId", invocationResult == null ? null : invocationResult.toolCallId(),
                        "toolInput", step.toolInput()
                ));
                String toolOutput = invocationResult == null ? step.toolOutput() : invocationResult.resultText();
                sessionRepository.markPlanStepCompleted(run.id(), step.stepNo(), toolOutput);
                trySend(emitter, "tool.completed", Map.of(
                        "sessionId", session.sessionCode(),
                        "runId", run.runCode(),
                        "stepNo", step.stepNo(),
                        "toolName", invocationResult == null ? step.toolName() : invocationResult.toolName(),
                        "toolType", invocationResult == null ? "BUILTIN" : invocationResult.toolType(),
                        "toolCallId", invocationResult == null ? null : invocationResult.toolCallId(),
                        "toolOutput", toolOutput
                ));
            }

            String reportContent = buildReport(session, effectiveCommand, plan, evidenceHits);
            String artifactCode = nextCode("art");
            sessionRepository.createArtifact(
                    artifactCode,
                    currentUser.id(),
                    session.id(),
                    run.id(),
                    ArtifactType.REPORT,
                    session.title() + " 研究报告",
                    reportContent,
                    null,
                    "text/markdown"
            );
            sessionRepository.createMessage(nextCode("msg"), session.id(), run.id(), "ASSISTANT", reportContent);
            sessionRepository.markRunCompleted(run.id());
            sessionRepository.markSessionStatus(session.id(), SessionStatus.COMPLETED);

            trySend(emitter, "artifact.created", Map.of(
                    "sessionId", session.sessionCode(),
                    "runId", run.runCode(),
                    "artifactId", artifactCode,
                    "artifactType", ArtifactType.REPORT.name(),
                    "title", session.title() + " 研究报告"
            ));
            trySend(emitter, "summary.completed", Map.of(
                    "sessionId", session.sessionCode(),
                    "runId", run.runCode(),
                    "summary", reportContent
            ));
            trySend(emitter, "session.completed", Map.of(
                    "sessionId", session.sessionCode(),
                    "runId", run.runCode(),
                    "completedAt", Instant.now().toString()
            ));
            emitter.complete();
        } catch (Exception exception) {
            sessionRepository.markRunFailed(run.id(), exception.getMessage());
            sessionRepository.markSessionStatus(session.id(), SessionStatus.FAILED);
            trySend(emitter, "session.failed", Map.of(
                    "sessionId", session.sessionCode(),
                    "runId", run.runCode(),
                    "message", exception.getMessage()
            ));
            emitter.completeWithError(exception);
        }
    }

    private List<String> resolveKnowledgeBaseIds(AgentSession session, List<String> requestedKnowledgeBaseIds) {
        if (requestedKnowledgeBaseIds != null && !requestedKnowledgeBaseIds.isEmpty()) {
            return requestedKnowledgeBaseIds;
        }
        return sessionRepository.listBoundKnowledgeBaseIds(session.id());
    }

    private ExecutionRun getOrCreatePendingRun(SessionUser currentUser, AgentSession session, SessionService.CreateRunCommand command) {
        return sessionRepository.findLatestPendingRun(session.id())
                .map(existing -> {
                    sessionRepository.refreshPendingRun(existing.id(), command.query(), command.executionMode(), command.knowledgeBaseIds());
                    return sessionRepository.findRunById(session.id(), existing.id())
                            .orElseThrow(() -> new IllegalStateException("Failed to reload pending run"));
                })
                .orElseGet(() -> {
                    String runCode = nextCode("run");
                    long runId = sessionRepository.createRun(
                            runCode,
                            session.id(),
                            currentUser.id(),
                            command.query(),
                            command.executionMode(),
                            command.knowledgeBaseIds()
                    );
                    return sessionRepository.findRunById(session.id(), runId)
                            .orElseThrow(() -> new IllegalStateException("Failed to load created run"));
                });
    }

    private List<PlanSeed> buildPlan(SessionService.CreateRunCommand command, List<SearchHit> evidenceHits) {
        String evidenceSummary = evidenceHits.isEmpty()
                ? "当前未绑定知识库，使用普通公开执行链路"
                : "检索到 " + evidenceHits.size() + " 条知识库证据，可注入执行上下文";
        String plannerHint = generatePlannerHint(command, evidenceHits);
        if (command.executionMode() == AgentMode.REACT) {
            return List.of(
                    new PlanSeed(1, "理解研究问题并确定范围", "query-analyzer", command.query(), plannerHint),
                    new PlanSeed(2, "快速收集公开信息与用户上下文", "knowledge-search", "knowledgeBaseIds=" + command.knowledgeBaseIds(), evidenceSummary),
                    new PlanSeed(3, "生成结构化研究结论", "report-writer", "format=markdown", "基于检索证据、工具结果与模型总结形成可回放报告")
            );
        }
        return List.of(
                new PlanSeed(1, "收集行业背景与市场边界", "market-scanner", command.query(), plannerHint),
                new PlanSeed(2, "注入知识库证据与上下文", "knowledge-search", "knowledgeBaseIds=" + command.knowledgeBaseIds(), evidenceSummary),
                new PlanSeed(3, "拆解主要玩家与竞争策略", "competitor-analyzer", "compare=players", "结合工具结果分析主要玩家、差异化能力与市场位置"),
                new PlanSeed(4, "归纳趋势并生成交付报告", "report-writer", "output=structured-report", "输出结论摘要、风险、建议与后续观察点")
        );
    }

    private String generatePlannerHint(SessionService.CreateRunCommand command, List<SearchHit> evidenceHits) {
        String prompt = """
                You are the Planner role for an AI research agent. Produce one concise Chinese planning note.
                Query: %s
                Execution mode: %s
                Evidence count: %d
                Return only the planning note, under 120 Chinese characters.
                """.formatted(command.query(), command.executionMode().name(), evidenceHits.size());
        return completeWithChatProvider(prompt);
    }

    private String buildReport(AgentSession session, SessionService.CreateRunCommand command, List<PlanSeed> plan, List<SearchHit> evidenceHits) {
        String fallbackReport = buildFallbackReport(session, command, plan, evidenceHits);
        String prompt = """
                You are the Summary role for AiAgent. Generate a production research report in Chinese Markdown.
                Requirements:
                - Include sections: 研究任务, 执行方式, 结构化结论, 检索证据, 执行步骤回顾, 后续建议.
                - Use the supplied citations exactly when evidence is available.
                - Do not invent citations.
                - Keep the report concise but decision-ready.

                Session title: %s
                Query: %s
                Agent mode: %s
                Execution mode: %s
                Knowledge bases: %s
                Plan and tool outputs:
                %s
                Evidence:
                %s
                """.formatted(
                session.title(),
                command.query(),
                session.agentMode().name(),
                command.executionMode().name(),
                command.knowledgeBaseIds().isEmpty() ? "none" : String.join(", ", command.knowledgeBaseIds()),
                planToPrompt(plan),
                evidenceToPrompt(evidenceHits)
        );
        String modelReport = completeWithChatProvider(prompt);
        if (modelReport == null || modelReport.isBlank() || modelReport.startsWith("[local-mock chat]")) {
            return fallbackReport;
        }
        return modelReport;
    }

    private String buildFallbackReport(AgentSession session, SessionService.CreateRunCommand command, List<PlanSeed> plan, List<SearchHit> evidenceHits) {
        StringBuilder builder = new StringBuilder();
        builder.append("# ").append(session.title()).append("\n\n");
        builder.append("## 研究任务\n");
        builder.append(command.query()).append("\n\n");
        builder.append("## 执行方式\n");
        builder.append("- Agent Mode: ").append(session.agentMode().name()).append("\n");
        builder.append("- Execution Mode: ").append(command.executionMode().name()).append("\n");
        builder.append("- Knowledge Bases: ").append(command.knowledgeBaseIds().isEmpty() ? "none" : String.join(", ", command.knowledgeBaseIds())).append("\n\n");
        builder.append("## 结构化结论\n");
        builder.append("1. 市场背景已经按目标主题完成初步梳理，当前输出基于配置的模型 provider、工具账本与检索证据生成。\n");
        builder.append("2. 竞争格局分析聚焦主要玩家、差异化能力和潜在风险，便于后续补充真实检索结果。\n");
        builder.append("3. 报告建议保留知识库绑定入口，以便后续将私有资料并入研究过程。\n\n");
        builder.append("## 检索证据\n");
        if (evidenceHits.isEmpty()) {
            builder.append("- 本次未命中知识库证据，已降级到普通执行链路。\n\n");
        } else {
            for (SearchHit hit : evidenceHits) {
                builder.append("- [").append(hit.kbId()).append("] ")
                        .append(hit.citationId()).append(" / rank ").append(hit.rank())
                        .append(" / strategy=").append(hit.retrievalStrategy()).append(" / ")
                        .append(hit.fileName()).append(" / chunk ").append(hit.chunkNo())
                        .append(hit.sectionTitle() == null || hit.sectionTitle().isBlank() ? "" : " / section=" + hit.sectionTitle())
                        .append(hit.headingPath() == null || hit.headingPath().isBlank() ? "" : " / path=" + hit.headingPath())
                        .append(" / score=").append(String.format("%.4f", hit.score()))
                        .append(" / ").append(hit.contentPreview()).append("\n");
            }
            builder.append("\n");
        }
        builder.append("## 执行步骤回顾\n");
        for (PlanSeed step : plan) {
            builder.append(step.stepNo()).append(". ").append(step.title()).append("：").append(step.toolOutput()).append("\n");
        }
        builder.append("\n## 后续建议\n");
        builder.append("- 接入真实外部工具与知识库后，可基于同一历史账本做二次研究。\n");
        builder.append("- 使用历史回放接口恢复完整执行记录。\n");
        return builder.toString();
    }

    private String completeWithChatProvider(String prompt) {
        try {
            AppProperties.Chat chat = appProperties.chat();
            ModelRuntimeResolver.RuntimeModel runtimeModel = modelRuntimeResolver.find(ModelType.CHAT, null)
                    .orElseGet(() -> new ModelRuntimeResolver.RuntimeModel(
                            chat.modelCode(),
                            chat.provider(),
                            ModelType.CHAT,
                            chat.baseUrl(),
                            chat.apiKey()
                    ));
            ChatModelProvider provider = chatModelProviderRouter.route(runtimeModel.provider());
            return provider.complete(new ChatModelProvider.ChatRequest(
                    prompt,
                    runtimeModel.modelCode(),
                    runtimeModel.baseUrl(),
                    runtimeModel.apiKey()
            )).text();
        } catch (Exception exception) {
            if (isProductionProfile()) {
                throw new AppException("MODEL_PROVIDER_FAILED", "Chat model provider failed", HttpStatus.BAD_GATEWAY);
            }
            return "[local-mock chat] " + prompt.substring(0, Math.min(prompt.length(), 120));
        }
    }

    private boolean isProductionProfile() {
        return !("local-mock".equalsIgnoreCase(appProperties.chat().provider()));
    }

    private String planToPrompt(List<PlanSeed> plan) {
        StringBuilder builder = new StringBuilder();
        for (PlanSeed step : plan) {
            builder.append(step.stepNo())
                    .append(". ")
                    .append(step.title())
                    .append(" / tool=")
                    .append(step.toolName())
                    .append(" / output=")
                    .append(step.toolOutput())
                    .append("\n");
        }
        return builder.toString();
    }

    private String evidenceToPrompt(List<SearchHit> evidenceHits) {
        if (evidenceHits.isEmpty()) {
            return "No evidence hits.";
        }
        StringBuilder builder = new StringBuilder();
        for (SearchHit hit : evidenceHits) {
            builder.append("- citation=")
                    .append(hit.citationId())
                    .append(", file=")
                    .append(hit.fileName())
                    .append(", section=")
                    .append(hit.sectionTitle())
                    .append(", score=")
                    .append(String.format("%.4f", hit.score()))
                    .append(", preview=")
                    .append(hit.contentPreview())
                    .append("\n");
        }
        return builder.toString();
    }

    private void trySend(SseEmitter emitter, String event, Object payload) {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("event", event);
            body.put("data", payload);
            emitter.send(SseEmitter.event().name(event).data(body));
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to stream event", exception);
        }
    }

    private String nextCode(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to serialize retrieval audit", exception);
        }
    }

    record PlanSeed(
            int stepNo,
            String title,
            String toolName,
            String toolInput,
            String toolOutput
    ) {
    }
}
