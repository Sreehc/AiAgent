package com.sreehc.aiagent.application.session;

import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.application.knowledge.KnowledgeBaseService;
import com.sreehc.aiagent.application.mcp.McpExecutionService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.session.AgentMode;
import com.sreehc.aiagent.domain.session.AgentSession;
import com.sreehc.aiagent.domain.session.ArtifactRecord;
import com.sreehc.aiagent.domain.session.ExecutionPlanStep;
import com.sreehc.aiagent.domain.session.ExecutionRun;
import com.sreehc.aiagent.domain.session.SessionStatus;
import com.sreehc.aiagent.domain.session.StrategyMode;
import com.sreehc.aiagent.infrastructure.session.SessionRepository;
import com.sreehc.aiagent.infrastructure.storage.ObjectStorageService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class SessionService {
    private final SessionRepository sessionRepository;
    private final KnowledgeBaseService knowledgeBaseService;
    private final McpExecutionService mcpExecutionService;
    private final SessionRunExecutor sessionRunExecutor;
    private final ObjectStorageService objectStorageService;
    private final RunControlService runControlService;
    private final ConversationMemoryService conversationMemoryService;

    public SessionService(
            SessionRepository sessionRepository,
            KnowledgeBaseService knowledgeBaseService,
            McpExecutionService mcpExecutionService,
            SessionRunExecutor sessionRunExecutor,
            ObjectStorageService objectStorageService,
            RunControlService runControlService,
            ConversationMemoryService conversationMemoryService
    ) {
        this.sessionRepository = sessionRepository;
        this.knowledgeBaseService = knowledgeBaseService;
        this.mcpExecutionService = mcpExecutionService;
        this.sessionRunExecutor = sessionRunExecutor;
        this.objectStorageService = objectStorageService;
        this.runControlService = runControlService;
        this.conversationMemoryService = conversationMemoryService;
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
    public void deleteSession(SessionUser currentUser, String sessionCode) {
        AgentSession session = loadOwnedSession(currentUser, sessionCode);
        if (session.status() == SessionStatus.RUNNING) {
            throw new AppException("SESSION_RUNNING", "Running session cannot be deleted", HttpStatus.CONFLICT);
        }
        sessionRepository.listArtifacts(session.id()).stream()
                .map(ArtifactRecord::storageUri)
                .filter(storageUri -> storageUri != null && !storageUri.isBlank())
                .forEach(objectStorageService::delete);
        if (!sessionRepository.deleteSession(currentUser.id(), sessionCode)) {
            throw new AppException("SESSION_NOT_FOUND", "Session not found", HttpStatus.NOT_FOUND);
        }
    }

    public SseEmitter streamRun(SessionUser currentUser, String sessionCode, CreateRunCommand command) {
        AgentSession session = loadOwnedSession(currentUser, sessionCode);
        SseEmitter emitter = new SseEmitter(0L);
        sessionRunExecutor.submit(currentUser, session, command, emitter);
        return emitter;
    }

    public ExecutionRun cancelRun(SessionUser currentUser, String sessionCode, String runCode, String reason) {
        AgentSession session = loadOwnedSession(currentUser, sessionCode);
        return runControlService.cancel(currentUser, session, runCode, reason);
    }

    public ExecutionRun pauseRun(SessionUser currentUser, String sessionCode, String runCode, String reason) {
        AgentSession session = loadOwnedSession(currentUser, sessionCode);
        return runControlService.pause(currentUser, session, runCode, reason);
    }

    public ExecutionRun resumeRun(SessionUser currentUser, String sessionCode, String runCode) {
        AgentSession session = loadOwnedSession(currentUser, sessionCode);
        return runControlService.resume(currentUser, session, runCode);
    }

    public String getSessionMemory(SessionUser currentUser, String sessionCode) {
        AgentSession session = loadOwnedSession(currentUser, sessionCode);
        return sessionRepository.findLatestSessionMemory(session.id(), "SUMMARY").orElse("");
    }

    public void updateSessionMemory(SessionUser currentUser, String sessionCode, String content) {
        AgentSession session = loadOwnedSession(currentUser, sessionCode);
        sessionRepository.upsertSessionMemory(session.id(), currentUser.id(), "SUMMARY", content == null ? "" : content, null, content == null ? 0 : content.length() / 4);
    }

    public String rebuildSessionMemory(SessionUser currentUser, String sessionCode) {
        AgentSession session = loadOwnedSession(currentUser, sessionCode);
        return conversationMemoryService.rebuildSummary(session.id(), currentUser.id());
    }

    public List<String> bindKnowledgeBases(SessionUser currentUser, String sessionCode, List<String> kbIds) {
        return knowledgeBaseService.bindSessionKnowledgeBases(currentUser, sessionCode, kbIds);
    }

    private AgentSession loadOwnedSession(SessionUser currentUser, String sessionCode) {
        return sessionRepository.findSessionByCode(currentUser.id(), sessionCode)
                .orElseThrow(() -> new AppException("SESSION_NOT_FOUND", "Session not found", HttpStatus.NOT_FOUND));
    }

    private String nextCode(String prefix) {
        return prefix + "_" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    public record CreateSessionCommand(
            String title,
            AgentMode agentMode
    ) {
    }

    public record CreateRunCommand(
            String query,
            AgentMode executionMode,
            List<String> knowledgeBaseIds,
            StrategyMode strategyMode,
            List<String> artifactIds
    ) {
        public CreateRunCommand(String query, AgentMode executionMode, List<String> knowledgeBaseIds) {
            this(query, executionMode, knowledgeBaseIds, StrategyMode.MANUAL, List.of());
        }

        public StrategyMode strategyMode() {
            return strategyMode == null ? StrategyMode.MANUAL : strategyMode;
        }

        public List<String> knowledgeBaseIds() {
            return knowledgeBaseIds == null ? List.of() : knowledgeBaseIds;
        }

        public List<String> artifactIds() {
            return artifactIds == null ? List.of() : artifactIds;
        }
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
}
