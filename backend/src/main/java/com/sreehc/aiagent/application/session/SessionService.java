package com.sreehc.aiagent.application.session;

import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.application.knowledge.KnowledgeBaseService;
import com.sreehc.aiagent.application.mcp.McpExecutionService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.knowledge.SearchHit;
import com.sreehc.aiagent.domain.session.AgentMode;
import com.sreehc.aiagent.domain.session.AgentSession;
import com.sreehc.aiagent.domain.session.ArtifactRecord;
import com.sreehc.aiagent.domain.session.ArtifactType;
import com.sreehc.aiagent.domain.session.ExecutionPlanStep;
import com.sreehc.aiagent.domain.session.ExecutionRun;
import com.sreehc.aiagent.domain.session.PlanStepStatus;
import com.sreehc.aiagent.domain.session.SessionStatus;
import com.sreehc.aiagent.infrastructure.session.SessionRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class SessionService {
    private final SessionRepository sessionRepository;
    private final KnowledgeBaseService knowledgeBaseService;
    private final McpExecutionService mcpExecutionService;

    public SessionService(
            SessionRepository sessionRepository,
            KnowledgeBaseService knowledgeBaseService,
            McpExecutionService mcpExecutionService
    ) {
        this.sessionRepository = sessionRepository;
        this.knowledgeBaseService = knowledgeBaseService;
        this.mcpExecutionService = mcpExecutionService;
    }

    @Transactional
    public AgentSession createSession(SessionUser currentUser, CreateSessionCommand command) {
        String sessionCode = nextCode("s");
        long sessionId = sessionRepository.createSession(
                sessionCode,
                currentUser.id(),
                command.title(),
                command.agentMode()
        );
        return sessionRepository.findSessionById(currentUser.id(), sessionId)
                .orElseThrow(() -> new IllegalStateException("Failed to load created session"));
    }

    public List<AgentSession> listSessions(SessionUser currentUser, int pageNo, int pageSize) {
        return sessionRepository.listSessions(currentUser.id(), pageNo, pageSize);
    }

    public SessionDetail getSessionDetail(SessionUser currentUser, String sessionCode) {
        AgentSession session = loadOwnedSession(currentUser, sessionCode);
        List<ExecutionRun> runs = sessionRepository.listRuns(session.id());
        ExecutionRun latestRun = runs.stream().findFirst().orElse(null);
        List<ExecutionPlanStep> planSteps = latestRun == null ? List.of() : sessionRepository.listPlanSteps(latestRun.id());
        List<McpExecutionService.ToolInvocationSummary> toolInvocations = latestRun == null ? List.of() : mcpExecutionService.listInvocations(latestRun.id());
        List<ArtifactRecord> artifacts = sessionRepository.listArtifacts(session.id());
        List<String> boundKnowledgeBaseIds = sessionRepository.listBoundKnowledgeBaseIds(session.id());
        String summary = sessionRepository.listMessages(session.id()).stream()
                .filter(message -> "ASSISTANT".equals(message.roleCode()))
                .reduce((first, second) -> second)
                .map(message -> message.content())
                .orElse(null);
        return new SessionDetail(session, runs, planSteps, toolInvocations, artifacts, summary, boundKnowledgeBaseIds);
    }

    @Transactional
    public RunCreated createRun(SessionUser currentUser, String sessionCode, CreateRunCommand command) {
        AgentSession session = loadOwnedSession(currentUser, sessionCode);
        ExecutionRun run = getOrCreatePendingRun(currentUser, session, command);
        return new RunCreated(run.runCode());
    }

    public SseEmitter streamRun(SessionUser currentUser, String sessionCode, CreateRunCommand command) {
        AgentSession session = loadOwnedSession(currentUser, sessionCode);
        SseEmitter emitter = new SseEmitter(0L);
        try {
            executeStream(currentUser, session, command, emitter);
        } catch (Exception exception) {
            trySend(emitter, "session.failed", Map.of(
                    "sessionId", session.sessionCode(),
                    "message", exception.getMessage()
            ));
            emitter.completeWithError(exception);
        }
        return emitter;
    }

    @Transactional
    protected void executeStream(SessionUser currentUser, AgentSession session, CreateRunCommand command, SseEmitter emitter) {
        List<String> effectiveKnowledgeBaseIds = resolveKnowledgeBaseIds(session, command.knowledgeBaseIds());
        CreateRunCommand effectiveCommand = new CreateRunCommand(
                command.query(),
                command.executionMode(),
                effectiveKnowledgeBaseIds
        );
        ExecutionRun run = getOrCreatePendingRun(currentUser, session, effectiveCommand);

        try {
            sessionRepository.markSessionStatus(session.id(), SessionStatus.RUNNING);
            sessionRepository.markRunStarted(run.id());
            sessionRepository.createMessage(nextCode("msg"), session.id(), run.id(), "USER", effectiveCommand.query());

            trySend(emitter, "session.started", Map.of(
                    "sessionId", session.sessionCode(),
                    "runId", run.runCode(),
                    "executionMode", effectiveCommand.executionMode().name(),
                    "knowledgeBaseIds", effectiveKnowledgeBaseIds,
                    "startedAt", Instant.now().toString()
            ));

            List<SearchHit> evidenceHits = knowledgeBaseService.searchAcrossKnowledgeBases(
                    currentUser,
                    effectiveKnowledgeBaseIds,
                    effectiveCommand.query(),
                    3
            );
            List<PlanSeed> plan = buildPlan(effectiveCommand, evidenceHits);
            for (PlanSeed step : plan) {
                sessionRepository.createPlanStep(run.id(), nextCode("step"), step.stepNo(), step.title(), PlanStepStatus.PENDING);
            }

            trySend(emitter, "plan.generated", Map.of(
                    "sessionId", session.sessionCode(),
                    "runId", run.runCode(),
                    "plannerRound", 1,
                    "plan", plan.stream().map(step -> Map.of(
                            "stepNo", step.stepNo(),
                            "title", step.title()
                    )).toList()
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

    private AgentSession loadOwnedSession(SessionUser currentUser, String sessionCode) {
        return sessionRepository.findSessionByCode(currentUser.id(), sessionCode)
                .orElseThrow(() -> new AppException("SESSION_NOT_FOUND", "Session not found", HttpStatus.NOT_FOUND));
    }

    private ExecutionRun getOrCreatePendingRun(SessionUser currentUser, AgentSession session, CreateRunCommand command) {
        return sessionRepository.findLatestPendingRun(session.id())
                .map(existing -> {
                    sessionRepository.refreshPendingRun(
                            existing.id(),
                            command.query(),
                            command.executionMode(),
                            command.knowledgeBaseIds()
                    );
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

    public List<String> bindKnowledgeBases(SessionUser currentUser, String sessionCode, List<String> kbIds) {
        return knowledgeBaseService.bindSessionKnowledgeBases(currentUser, sessionCode, kbIds);
    }

    private List<String> resolveKnowledgeBaseIds(AgentSession session, List<String> requestedKnowledgeBaseIds) {
        if (requestedKnowledgeBaseIds != null && !requestedKnowledgeBaseIds.isEmpty()) {
            return requestedKnowledgeBaseIds;
        }
        return sessionRepository.listBoundKnowledgeBaseIds(session.id());
    }

    private List<PlanSeed> buildPlan(CreateRunCommand command, List<SearchHit> evidenceHits) {
        String evidenceSummary = evidenceHits.isEmpty()
                ? "当前未绑定知识库，使用普通公开执行链路"
                : "检索到 " + evidenceHits.size() + " 条知识库证据，可注入执行上下文";
        if (command.executionMode() == AgentMode.REACT) {
            return List.of(
                    new PlanSeed(1, "理解研究问题并确定范围", "query-analyzer", command.query(), "识别时间范围、行业对象、输出格式要求"),
                    new PlanSeed(2, "快速收集公开信息与用户上下文", "knowledge-search", "knowledgeBaseIds=" + command.knowledgeBaseIds(), evidenceSummary),
                    new PlanSeed(3, "生成结构化研究结论", "report-writer", "format=markdown", "形成摘要、竞争格局、趋势判断与行动建议")
            );
        }
        return List.of(
                new PlanSeed(1, "收集行业背景与市场边界", "market-scanner", command.query(), "定义研究对象、时间窗口、关键假设"),
                new PlanSeed(2, "注入知识库证据与上下文", "knowledge-search", "knowledgeBaseIds=" + command.knowledgeBaseIds(), evidenceSummary),
                new PlanSeed(3, "拆解主要玩家与竞争策略", "competitor-analyzer", "compare=players", "梳理头部玩家、差异化能力、市场位置"),
                new PlanSeed(4, "归纳趋势并生成交付报告", "report-writer", "output=structured-report", "输出结论摘要、风险、建议与后续观察点")
        );
    }

    private String buildReport(AgentSession session, CreateRunCommand command, List<PlanSeed> plan, List<SearchHit> evidenceHits) {
        StringBuilder builder = new StringBuilder();
        builder.append("# ").append(session.title()).append("\n\n");
        builder.append("## 研究任务\n");
        builder.append(command.query()).append("\n\n");
        builder.append("## 执行方式\n");
        builder.append("- Agent Mode: ").append(session.agentMode().name()).append("\n");
        builder.append("- Execution Mode: ").append(command.executionMode().name()).append("\n");
        builder.append("- Knowledge Bases: ").append(command.knowledgeBaseIds().isEmpty() ? "none" : String.join(", ", command.knowledgeBaseIds())).append("\n\n");
        builder.append("## 结构化结论\n");
        builder.append("1. 市场背景已经按目标主题完成初步梳理，当前输出基于公开信息模拟链路。\n");
        builder.append("2. 竞争格局分析聚焦主要玩家、差异化能力和潜在风险，便于后续补充真实检索结果。\n");
        builder.append("3. 报告建议保留知识库绑定入口，以便后续将私有资料并入研究过程。\n\n");
        builder.append("## 检索证据\n");
        if (evidenceHits.isEmpty()) {
            builder.append("- 本次未命中知识库证据，已降级到普通执行链路。\n\n");
        } else {
            for (SearchHit hit : evidenceHits) {
                builder.append("- [").append(hit.kbId()).append("] ")
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
        builder.append("- 接入真实外部工具与知识库后再做二次研究。\n");
        builder.append("- 使用历史回放接口恢复完整执行记录。\n");
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

    public record CreateSessionCommand(
            String title,
            AgentMode agentMode
    ) {
    }

    public record CreateRunCommand(
            String query,
            AgentMode executionMode,
            List<String> knowledgeBaseIds
    ) {
    }

    public record RunCreated(
            String runId
    ) {
    }

    public record SessionDetail(
            AgentSession session,
            List<ExecutionRun> runs,
            List<ExecutionPlanStep> planSteps,
            List<McpExecutionService.ToolInvocationSummary> toolInvocations,
            List<ArtifactRecord> artifacts,
            String summary,
            List<String> knowledgeBaseIds
    ) {
    }

    private record PlanSeed(
            int stepNo,
            String title,
            String toolName,
            String toolInput,
            String toolOutput
    ) {
    }
}
