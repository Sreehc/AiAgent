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
import java.util.ArrayList;
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
    private final AgentStrategySelector agentStrategySelector;
    private final ConversationMemoryService conversationMemoryService;
    private final DynamicPlannerService dynamicPlannerService;
    private final ThreadPoolTaskExecutor executor;

    public SessionRunExecutor(
            SessionRepository sessionRepository,
            KnowledgeBaseService knowledgeBaseService,
            McpExecutionService mcpExecutionService,
            ObjectMapper objectMapper,
            ChatModelProviderRouter chatModelProviderRouter,
            ModelRuntimeResolver modelRuntimeResolver,
            AppProperties appProperties,
            AgentStrategySelector agentStrategySelector,
            ConversationMemoryService conversationMemoryService,
            DynamicPlannerService dynamicPlannerService
    ) {
        this.sessionRepository = sessionRepository;
        this.knowledgeBaseService = knowledgeBaseService;
        this.mcpExecutionService = mcpExecutionService;
        this.objectMapper = objectMapper;
        this.chatModelProviderRouter = chatModelProviderRouter;
        this.modelRuntimeResolver = modelRuntimeResolver;
        this.appProperties = appProperties;
        this.agentStrategySelector = agentStrategySelector;
        this.conversationMemoryService = conversationMemoryService;
        this.dynamicPlannerService = dynamicPlannerService;
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
        AgentStrategySelector.Decision strategy = agentStrategySelector.select(
                command.query(),
                command.executionMode(),
                command.strategyMode(),
                effectiveKnowledgeBaseIds,
                command.artifactIds()
        );
        SessionService.CreateRunCommand effectiveCommand = new SessionService.CreateRunCommand(
                command.query(),
                strategy.executionMode(),
                effectiveKnowledgeBaseIds,
                command.strategyMode(),
                command.artifactIds()
        );
        ExecutionRun run = getOrCreatePendingRun(currentUser, session, effectiveCommand);
        ConversationMemoryService.MemoryContext memoryContext = conversationMemoryService.loadContext(session.id(), currentUser.id(), command.artifactIds());
        String memoryPrompt = conversationMemoryService.toPrompt(memoryContext);

        try {
            sessionRepository.markSessionStatus(session.id(), SessionStatus.RUNNING);
            if (!sessionRepository.markRunStarted(run.id())) {
                throw new AppException("RUN_ALREADY_RUNNING", "Run is already running", HttpStatus.CONFLICT);
            }
            sessionRepository.updateRunStrategy(run.id(), effectiveCommand.executionMode(), strategy.source(), 1);
            sessionRepository.createMessage(nextCode("msg"), session.id(), run.id(), "USER", effectiveCommand.query());
            trySend(emitter, "session.started", Map.of(
                    "sessionId", session.sessionCode(),
                    "runId", run.runCode(),
                    "executionMode", effectiveCommand.executionMode().name(),
                    "knowledgeBaseIds", effectiveKnowledgeBaseIds,
                    "startedAt", Instant.now().toString()
            ));
            trySend(emitter, "strategy.selected", Map.of(
                    "sessionId", session.sessionCode(),
                    "runId", run.runCode(),
                    "executionMode", effectiveCommand.executionMode().name(),
                    "source", strategy.source(),
                    "reason", strategy.reason(),
                    "confidence", strategy.confidence()
            ));

            if (!memoryContext.inputArtifacts().isEmpty() && !memoryPrompt.isBlank()) {
                String contextArtifactCode = nextCode("art");
                sessionRepository.createArtifact(
                        contextArtifactCode,
                        currentUser.id(),
                        session.id(),
                        run.id(),
                        ArtifactType.CONTEXT_SNIPPET,
                        "复用上下文 · " + session.title(),
                        memoryPrompt,
                        null,
                        "text/markdown"
                );
                trySend(emitter, "artifact.created", Map.of(
                        "sessionId", session.sessionCode(),
                        "runId", run.runCode(),
                        "artifactId", contextArtifactCode,
                        "artifactType", ArtifactType.CONTEXT_SNIPPET.name(),
                        "title", "复用上下文 · " + session.title()
                ));
            }

            KnowledgeBaseService.SearchResult searchResult = searchWithFallback(currentUser, effectiveKnowledgeBaseIds, effectiveCommand.query(), run, session, emitter);
            sessionRepository.updateRunRetrievalAudit(
                    run.id(),
                    searchResult.retrievalQuery(),
                    toJson(searchResult.recallHits()),
                    toJson(searchResult.finalEvidenceHits())
            );
            List<SearchHit> evidenceHits = searchResult.finalEvidenceHits();
            List<PlanSeed> plan = new ArrayList<>(buildPlan(currentUser, effectiveCommand, evidenceHits, memoryPrompt));
            for (PlanSeed step : plan) {
                sessionRepository.createPlanStep(run.id(), nextCode("step"), step.stepNo(), step.title(), PlanStepStatus.PENDING);
            }

            trySend(emitter, "plan.generated", Map.of(
                    "sessionId", session.sessionCode(),
                    "runId", run.runCode(),
                    "plannerRound", 1,
                    "plan", plan.stream().map(step -> Map.of("stepNo", step.stepNo(), "title", step.title())).toList()
            ));

            List<PlanSeed> completedPlan = new ArrayList<>();
            int index = 0;
            int planningRounds = 1;
            while (index < plan.size()) {
                PlanSeed step = plan.get(index);
                awaitRunControl(session, run, emitter);
                sessionRepository.updateRunHeartbeat(run.id());
                sessionRepository.markPlanStepRunning(run.id(), step.stepNo(), step.toolName(), step.toolInput());
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
                        "toolName", step.toolName(),
                        "toolType", "PENDING",
                        "toolCallId", null,
                        "toolInput", step.toolInput()
                ));
                McpExecutionService.InvocationResult invocationResult = mcpExecutionService.invokeForStep(
                        run.id(),
                        step.toolName(),
                        step.title(),
                        step.toolInput()
                );
                cancelIfRequested(session, run, emitter);
                String toolOutput = invocationResult == null ? step.toolOutput() : invocationResult.resultText();
                sessionRepository.markPlanStepCompleted(run.id(), step.stepNo(), toolOutput);
                sessionRepository.createArtifact(
                        nextCode("art"),
                        currentUser.id(),
                        session.id(),
                        run.id(),
                        ArtifactType.TOOL_OUTPUT,
                        "Tool output · " + step.title(),
                        toolOutput,
                        null,
                        "text/plain"
                );
                trySend(emitter, "tool.completed", Map.of(
                        "sessionId", session.sessionCode(),
                        "runId", run.runCode(),
                        "stepNo", step.stepNo(),
                        "toolName", invocationResult == null ? step.toolName() : invocationResult.toolName(),
                        "toolType", invocationResult == null ? "BUILTIN" : invocationResult.toolType(),
                        "toolCallId", invocationResult == null ? null : invocationResult.toolCallId(),
                        "toolOutput", toolOutput
                ));
                PlanSeed observedStep = new PlanSeed(step.stepNo(), step.title(), step.toolName(), step.toolInput(), toolOutput);
                completedPlan.add(observedStep);
                boolean toolFailed = invocationResult != null && !invocationResult.success();
                String judgementPrompt = generateJudgementPrompt(currentUser, effectiveCommand, completedPlan, evidenceHits, memoryPrompt, toolFailed);
                DynamicPlannerService.PlannerJudgement judgement = dynamicPlannerService.parseOrFallbackJudgement(
                        completeWithChatProvider(currentUser, judgementPrompt),
                        step.stepNo(),
                        plan.size(),
                        planningRounds,
                        toolFailed,
                        toolOutput
                );
                sessionRepository.markPlanStepObserved(run.id(), step.stepNo(), toolOutput, judgement.action().name() + ":" + judgement.reason());
                trySend(emitter, "task.observed", Map.of(
                        "sessionId", session.sessionCode(),
                        "runId", run.runCode(),
                        "stepNo", step.stepNo(),
                        "observation", toolOutput
                ));
                trySend(emitter, "plan.judged", Map.of(
                        "sessionId", session.sessionCode(),
                        "runId", run.runCode(),
                        "stepNo", step.stepNo(),
                        "action", judgement.action().name(),
                        "reason", judgement.reason()
                ));
                if (judgement.action() == DynamicPlannerService.PlannerAction.DONE) {
                    break;
                }
                if (judgement.action() == DynamicPlannerService.PlannerAction.REPLAN
                        && planningRounds < dynamicPlannerService.maxPlanningRounds()
                        && plan.size() < dynamicPlannerService.maxPlanSteps()) {
                    planningRounds++;
                    sessionRepository.updateRunPlanningRounds(run.id(), planningRounds);
                    List<PlanSeed> replanSteps = dynamicPlannerService.trimReplanSteps(
                                    plan.stream().map(this::toPlanDraft).toList(),
                                    judgement.steps()
                            ).stream()
                            .map(this::toPlanSeed)
                            .toList();
                    plan.addAll(replanSteps);
                    for (PlanSeed replanStep : replanSteps) {
                        sessionRepository.createPlanStep(run.id(), nextCode("step"), replanStep.stepNo(), replanStep.title(), PlanStepStatus.PENDING);
                    }
                    trySend(emitter, "plan.replanned", Map.of(
                            "sessionId", session.sessionCode(),
                            "runId", run.runCode(),
                            "plannerRound", planningRounds,
                            "plan", replanSteps.stream().map(replanStep -> Map.of("stepNo", replanStep.stepNo(), "title", replanStep.title())).toList()
                    ));
                }
                index++;
            }

            awaitRunControl(session, run, emitter);
            String reportContent = buildReport(currentUser, session, effectiveCommand, completedPlan, evidenceHits, memoryPrompt);
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
            conversationMemoryService.updateSummary(session.id(), currentUser.id(), run.id(), reportContent);
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
            String errorCode = exception instanceof AppException appException
                    ? appException.code()
                    : "SESSION_EXECUTION_FAILED";
            String errorMessage = exception.getMessage() == null || exception.getMessage().isBlank()
                    ? "Session execution failed"
                    : exception.getMessage();
            if ("RUN_CANCELLED".equals(errorCode) || "RUN_PAUSED_INTERRUPTED".equals(errorCode)) {
                emitter.complete();
                return;
            }
            sessionRepository.markRunFailed(run.id(), errorMessage);
            sessionRepository.markSessionStatus(session.id(), SessionStatus.FAILED);
            trySend(emitter, "session.failed", Map.of(
                    "sessionId", session.sessionCode(),
                    "runId", run.runCode(),
                    "code", errorCode,
                    "message", errorMessage
            ));
            emitter.complete();
        }
    }

    private KnowledgeBaseService.SearchResult searchWithFallback(
            SessionUser currentUser,
            List<String> effectiveKnowledgeBaseIds,
            String query,
            ExecutionRun run,
            AgentSession session,
            SseEmitter emitter
    ) {
        try {
            return knowledgeBaseService.searchAcrossKnowledgeBasesWithAudit(currentUser, effectiveKnowledgeBaseIds, query, 3);
        } catch (AppException exception) {
            if (exception.status().is4xxClientError()) {
                throw exception;
            }
            return degradeRag(run, session, emitter, query, exception.getMessage());
        } catch (Exception exception) {
            return degradeRag(run, session, emitter, query, exception.getMessage());
        }
    }

    private KnowledgeBaseService.SearchResult degradeRag(ExecutionRun run, AgentSession session, SseEmitter emitter, String query, String message) {
        sessionRepository.appendRunFallbackReason(run.id(), "RAG_DEGRADED", message);
        trySend(emitter, "rag.degraded", Map.of(
                "sessionId", session.sessionCode(),
                "runId", run.runCode(),
                "message", message == null ? "RAG retrieval failed; continuing without evidence" : message
        ));
        return new KnowledgeBaseService.SearchResult(query, List.of(), List.of());
    }

    private void awaitRunControl(AgentSession session, ExecutionRun run, SseEmitter emitter) {
        if (sessionRepository.isRunCancelRequested(run.id())) {
            cancelIfRequested(session, run, emitter);
        }
        boolean pauseEventSent = false;
        while (sessionRepository.isRunPaused(run.id())) {
            if (!pauseEventSent) {
                sessionRepository.markSessionStatus(session.id(), SessionStatus.PAUSED);
                trySend(emitter, "session.paused", Map.of(
                        "sessionId", session.sessionCode(),
                        "runId", run.runCode(),
                        "pausedAt", Instant.now().toString()
                ));
                pauseEventSent = true;
            }
            if (sessionRepository.isRunCancelRequested(run.id())) {
                cancelIfRequested(session, run, emitter);
            }
            try {
                Thread.sleep(500L);
            } catch (InterruptedException interruptedException) {
                Thread.currentThread().interrupt();
                throw new AppException("RUN_PAUSED_INTERRUPTED", "Run pause wait interrupted", HttpStatus.CONFLICT);
            }
        }
        if (pauseEventSent) {
            sessionRepository.markSessionStatus(session.id(), SessionStatus.RUNNING);
            trySend(emitter, "session.resumed", Map.of(
                    "sessionId", session.sessionCode(),
                    "runId", run.runCode(),
                    "resumedAt", Instant.now().toString()
            ));
        }
    }

    private void cancelIfRequested(AgentSession session, ExecutionRun run, SseEmitter emitter) {
        if (!sessionRepository.isRunCancelRequested(run.id())) {
            return;
        }
        sessionRepository.markRunCancelled(run.id(), "Cancelled by user");
        sessionRepository.markSessionStatus(session.id(), SessionStatus.CANCELLED);
        trySend(emitter, "session.cancelled", Map.of(
                "sessionId", session.sessionCode(),
                "runId", run.runCode(),
                "cancelledAt", Instant.now().toString()
        ));
        throw new AppException("RUN_CANCELLED", "Run cancelled", HttpStatus.CONFLICT);
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

    private List<PlanSeed> buildPlan(SessionUser currentUser, SessionService.CreateRunCommand command, List<SearchHit> evidenceHits, String memoryPrompt) {
        String plannerHint = generatePlannerHint(currentUser, command, evidenceHits, memoryPrompt);
        return dynamicPlannerService.parseOrFallbackPlan(plannerHint, command, evidenceHits, memoryPrompt).stream()
                .map(this::toPlanSeed)
                .toList();
    }

    private String generatePlannerHint(SessionUser currentUser, SessionService.CreateRunCommand command, List<SearchHit> evidenceHits, String memoryPrompt) {
        String prompt = """
                You are the Planner role for an AI research agent. Return a JSON array of 2-6 steps.
                Each step must include title, toolName, toolInput, toolOutput.
                Query: %s
                Execution mode: %s
                Evidence count: %d
                Memory:
                %s
                Return only JSON.
                """.formatted(command.query(), command.executionMode().name(), evidenceHits.size(), memoryPrompt == null ? "" : memoryPrompt);
        return completeWithChatProvider(currentUser, prompt);
    }

    private String generateJudgementPrompt(SessionUser currentUser, SessionService.CreateRunCommand command, List<PlanSeed> completedPlan, List<SearchHit> evidenceHits, String memoryPrompt, boolean toolFailed) {
        String prompt = """
                You are the Planner/Judge role for an AI research agent.
                Decide whether the run objective is done, should continue, or needs replanning.
                Return one JSON object only:
                {"action":"CONTINUE|REPLAN|DONE","reason":"short reason","steps":[{"title":"","toolName":"","toolInput":"","toolOutput":""}]}

                Query: %s
                Execution mode: %s
                Tool failed: %s
                Completed steps:
                %s
                Evidence count: %d
                Memory:
                %s
                """.formatted(
                command.query(),
                command.executionMode().name(),
                toolFailed,
                planToPrompt(completedPlan),
                evidenceHits.size(),
                memoryPrompt == null ? "" : memoryPrompt
        );
        return completeWithChatProvider(currentUser, prompt);
    }

    private String buildReport(SessionUser currentUser, AgentSession session, SessionService.CreateRunCommand command, List<PlanSeed> plan, List<SearchHit> evidenceHits, String memoryPrompt) {
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
                Memory:
                %s
                """.formatted(
                session.title(),
                command.query(),
                session.agentMode().name(),
                command.executionMode().name(),
                command.knowledgeBaseIds().isEmpty() ? "none" : String.join(", ", command.knowledgeBaseIds()),
                planToPrompt(plan),
                evidenceToPrompt(evidenceHits),
                memoryPrompt == null ? "" : memoryPrompt
        );
        String modelReport = completeWithChatProvider(currentUser, prompt);
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

    private String completeWithChatProvider(SessionUser currentUser, String prompt) {
        try {
            ModelRuntimeResolver.RuntimeModel runtimeModel = resolveChatRuntimeModel(currentUser);
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

    private ModelRuntimeResolver.RuntimeModel resolveChatRuntimeModel(SessionUser currentUser) {
        AppProperties.Chat chat = appProperties.chat();
        return modelRuntimeResolver.findForUser(currentUser, ModelType.CHAT, null)
                .orElseGet(() -> new ModelRuntimeResolver.RuntimeModel(
                        chat.modelCode(),
                        chat.provider(),
                        ModelType.CHAT,
                        chat.baseUrl(),
                        chat.apiKey()
                ));
    }

    private List<PlanSeed> parsePlannerJson(String plannerJson) {
        if (plannerJson == null || plannerJson.isBlank() || !plannerJson.stripLeading().startsWith("[")) {
            return List.of();
        }
        try {
            List<?> rawSteps = objectMapper.readValue(plannerJson, List.class);
            List<PlanSeed> steps = new ArrayList<>();
            int index = 1;
            for (Object rawStep : rawSteps) {
                if (rawStep instanceof Map<?, ?> map) {
                    String title = stringValue(map.get("title"));
                    String toolName = stringValue(map.get("toolName"));
                    if (title.isBlank() || toolName.isBlank()) {
                        continue;
                    }
                    steps.add(new PlanSeed(
                            index++,
                            title,
                            toolName,
                            stringValue(map.get("toolInput")),
                            stringValue(map.get("toolOutput"))
                    ));
                }
            }
            return steps;
        } catch (Exception exception) {
            return List.of();
        }
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private PlanSeed toPlanSeed(DynamicPlannerService.PlanDraft draft) {
        return new PlanSeed(draft.stepNo(), draft.title(), draft.toolName(), draft.toolInput(), draft.toolOutput());
    }

    private DynamicPlannerService.PlanDraft toPlanDraft(PlanSeed seed) {
        return new DynamicPlannerService.PlanDraft(seed.stepNo(), seed.title(), seed.toolName(), seed.toolInput(), seed.toolOutput());
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
