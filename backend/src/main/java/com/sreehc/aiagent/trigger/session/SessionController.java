package com.sreehc.aiagent.trigger.session;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sreehc.aiagent.application.common.AppException;
import com.sreehc.aiagent.application.session.SessionService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.knowledge.SearchHit;
import com.sreehc.aiagent.domain.session.AgentMode;
import com.sreehc.aiagent.domain.session.AgentSession;
import com.sreehc.aiagent.domain.session.StrategyMode;
import com.sreehc.aiagent.infrastructure.storage.ObjectStorageService;
import com.sreehc.aiagent.trigger.ApiResponse;
import com.sreehc.aiagent.trigger.AuthFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@Validated
@RequestMapping("/api/v1/sessions")
public class SessionController {
    private final SessionService sessionService;
    private final ObjectStorageService objectStorageService;
    private final ObjectMapper objectMapper;

    public SessionController(SessionService sessionService, ObjectStorageService objectStorageService, ObjectMapper objectMapper) {
        this.sessionService = sessionService;
        this.objectStorageService = objectStorageService;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    public ApiResponse<SessionResponse> createSession(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @Valid @RequestBody CreateSessionRequest request
    ) {
        AgentSession session = sessionService.createSession(currentUser, new SessionService.CreateSessionCommand(
                request.title(),
                request.agentMode()
        ));
        return ApiResponse.success(toSessionResponse(session));
    }

    @GetMapping
    public ApiResponse<SessionListResponse> listSessions(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        List<SessionResponse> items = sessionService.listSessions(currentUser, pageNo, pageSize).stream()
                .map(this::toSessionResponse)
                .toList();
        return ApiResponse.success(new SessionListResponse(pageNo, pageSize, items));
    }

    @GetMapping("/{sessionId}")
    public ApiResponse<SessionDetailResponse> getSession(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable("sessionId") String sessionId
    ) {
        return ApiResponse.success(toSessionDetailResponse(sessionService.getSessionDetail(currentUser, sessionId)));
    }

    @GetMapping("/{sessionId}/replay")
    public ApiResponse<SessionDetailResponse> replaySession(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable("sessionId") String sessionId
    ) {
        return ApiResponse.success(toSessionDetailResponse(sessionService.getSessionDetail(currentUser, sessionId)));
    }

    @DeleteMapping("/{sessionId}")
    public ApiResponse<Void> deleteSession(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable("sessionId") String sessionId
    ) {
        sessionService.deleteSession(currentUser, sessionId);
        return ApiResponse.success(null);
    }

    @PostMapping(
            path = "/{sessionId}/stream",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE
    )
    public SseEmitter streamRun(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable("sessionId") String sessionId,
            @RequestBody(required = false) CreateRunRequest request
    ) {
        if (request == null) {
            return failedStream("PARAM_INVALID", "Request body is required");
        }
        if (request.query() == null || request.query().isBlank()) {
            return failedStream("PARAM_INVALID", "Query is required");
        }
        if (request.executionMode() == null && request.strategyMode() != StrategyMode.AUTO) {
            return failedStream("PARAM_INVALID", "Execution mode is required");
        }
        try {
            return sessionService.streamRun(currentUser, sessionId, new SessionService.CreateRunCommand(
                    request.query(),
                    request.executionMode() == null ? AgentMode.REACT : request.executionMode(),
                    request.knowledgeBaseIds(),
                    request.strategyMode(),
                    request.artifactIds()
            ));
        } catch (AppException exception) {
            return failedStream(exception.code(), exception.getMessage());
        }
    }

    @PostMapping("/{sessionId}/runs/{runId}/cancel")
    public ApiResponse<RunResponse> cancelRun(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable("sessionId") String sessionId,
            @PathVariable("runId") String runId,
            @RequestBody(required = false) CancelRunRequest request
    ) {
        return ApiResponse.success(toRunResponse(sessionService.cancelRun(currentUser, sessionId, runId, request == null ? null : request.reason())));
    }

    @PostMapping("/{sessionId}/runs/{runId}/pause")
    public ApiResponse<RunResponse> pauseRun(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable("sessionId") String sessionId,
            @PathVariable("runId") String runId,
            @RequestBody(required = false) CancelRunRequest request
    ) {
        return ApiResponse.success(toRunResponse(sessionService.pauseRun(currentUser, sessionId, runId, request == null ? null : request.reason())));
    }

    @PostMapping("/{sessionId}/runs/{runId}/resume")
    public ApiResponse<RunResponse> resumeRun(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable("sessionId") String sessionId,
            @PathVariable("runId") String runId
    ) {
        return ApiResponse.success(toRunResponse(sessionService.resumeRun(currentUser, sessionId, runId)));
    }

    @GetMapping("/{sessionId}/memory")
    public ApiResponse<SessionMemoryResponse> getMemory(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable("sessionId") String sessionId
    ) {
        return ApiResponse.success(new SessionMemoryResponse(sessionId, sessionService.getSessionMemory(currentUser, sessionId)));
    }

    @PutMapping("/{sessionId}/memory")
    public ApiResponse<SessionMemoryResponse> updateMemory(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable("sessionId") String sessionId,
            @RequestBody SessionMemoryRequest request
    ) {
        sessionService.updateSessionMemory(currentUser, sessionId, request == null ? "" : request.content());
        return ApiResponse.success(new SessionMemoryResponse(sessionId, sessionService.getSessionMemory(currentUser, sessionId)));
    }

    @PostMapping("/{sessionId}/memory/rebuild")
    public ApiResponse<SessionMemoryResponse> rebuildMemory(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable("sessionId") String sessionId
    ) {
        return ApiResponse.success(new SessionMemoryResponse(sessionId, sessionService.rebuildSessionMemory(currentUser, sessionId)));
    }

    private SseEmitter failedStream(String code, String message) {
        SseEmitter emitter = new SseEmitter(0L);
        try {
            emitter.send(SseEmitter.event().name("request.failed").data(Map.of(
                    "event", "request.failed",
                    "data", Map.of("code", code, "message", message)
            )));
        } catch (Exception ignored) {
            // The client may disconnect before receiving the terminal event.
        }
        emitter.complete();
        return emitter;
    }

    private SessionResponse toSessionResponse(AgentSession session) {
        return new SessionResponse(
                session.sessionCode(),
                session.title(),
                session.agentMode().name(),
                session.status().name(),
                session.createdAt().toString()
        );
    }

    private SessionDetailResponse toSessionDetailResponse(SessionService.SessionDetail detail) {
        return new SessionDetailResponse(
                toSessionResponse(detail.session()),
                detail.runs().stream().map(this::toRunResponse).toList(),
                detail.planSteps().stream().map(step -> new PlanStepResponse(
                        step.stepNo(),
                        step.title(),
                        step.status().name(),
                        step.toolName(),
                        step.toolInput(),
                        step.toolOutput()
                )).toList(),
                detail.toolInvocations().stream().map(toolInvocation -> new ToolInvocationResponse(
                        toolInvocation.toolCallId(),
                        toolInvocation.toolName(),
                        toolInvocation.toolType(),
                        toolInvocation.status(),
                        toolInvocation.requestPayload(),
                        toolInvocation.responsePayload(),
                        toolInvocation.startedAt().toString(),
                        toolInvocation.endedAt() == null ? null : toolInvocation.endedAt().toString()
                )).toList(),
                detail.artifacts().stream().map(artifact -> new ArtifactResponse(
                        artifact.artifactCode(),
                        artifact.artifactType().name(),
                        artifact.title(),
                        artifact.content(),
                        artifact.storageUri(),
                        artifact.mimeType(),
                        artifact.storageUri() == null ? null : objectStorageService.createDownloadUrl(artifact.storageUri()),
                        artifact.createdAt().toString()
                )).toList(),
                detail.summary(),
                detail.knowledgeBaseIds()
        );
    }

    private RunResponse toRunResponse(com.sreehc.aiagent.domain.session.ExecutionRun run) {
        return new RunResponse(
                run.runCode(),
                run.queryText(),
                run.retrievalQuery(),
                run.executionMode().name(),
                run.status().name(),
                run.knowledgeBaseIds(),
                parseEvidenceSet(run.recallSetJson()),
                parseEvidenceSet(run.finalEvidenceSetJson()),
                run.startedAt() == null ? null : run.startedAt().toString(),
                run.completedAt() == null ? null : run.completedAt().toString(),
                run.heartbeatAt() == null ? null : run.heartbeatAt().toString(),
                run.cancelRequestedAt() == null ? null : run.cancelRequestedAt().toString(),
                run.cancelReason(),
                run.pausedAt() == null ? null : run.pausedAt().toString(),
                run.pauseReason(),
                run.resumedAt() == null ? null : run.resumedAt().toString(),
                run.timeoutAt() == null ? null : run.timeoutAt().toString(),
                run.recoveredAt() == null ? null : run.recoveredAt().toString(),
                run.strategySource(),
                run.planningRounds(),
                run.fallbackReasonsJson(),
                run.errorMessage()
        );
    }

    @PostMapping("/{sessionId}/knowledge-bases/bind")
    public ApiResponse<SessionKnowledgeBaseBindingResponse> bindKnowledgeBases(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable("sessionId") String sessionId,
            @Valid @RequestBody BindKnowledgeBasesRequest request
    ) {
        List<String> kbIds = sessionService.bindKnowledgeBases(currentUser, sessionId, request.knowledgeBaseIds());
        return ApiResponse.success(new SessionKnowledgeBaseBindingResponse(sessionId, kbIds));
    }

    public record CreateSessionRequest(
            @NotBlank @Size(max = 256) String title,
            @NotNull AgentMode agentMode
    ) {
    }

    public record CreateRunRequest(
            @NotBlank String query,
            AgentMode executionMode,
            StrategyMode strategyMode,
            List<String> knowledgeBaseIds,
            List<String> artifactIds
    ) {
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

    public record CancelRunRequest(
            String reason
    ) {
    }

    public record SessionMemoryRequest(
            String content
    ) {
    }

    public record SessionMemoryResponse(
            String sessionId,
            String content
    ) {
    }

    public record SessionResponse(
            String sessionId,
            String title,
            String agentMode,
            String status,
            String createdAt
    ) {
    }

    public record SessionListResponse(
            int pageNo,
            int pageSize,
            List<SessionResponse> items
    ) {
    }

    public record RunResponse(
            String runId,
            String query,
            String retrievalQuery,
            String executionMode,
            String status,
            List<String> knowledgeBaseIds,
            List<EvidenceResponse> recallSet,
            List<EvidenceResponse> finalEvidenceSet,
            String startedAt,
            String completedAt,
            String heartbeatAt,
            String cancelRequestedAt,
            String cancelReason,
            String pausedAt,
            String pauseReason,
            String resumedAt,
            String timeoutAt,
            String recoveredAt,
            String strategySource,
            int planningRounds,
            String fallbackReasonsJson,
            String errorMessage
    ) {
    }

    public record PlanStepResponse(
            int stepNo,
            String title,
            String status,
            String toolName,
            String toolInput,
            String toolOutput
    ) {
    }

    public record ArtifactResponse(
            String artifactId,
            String artifactType,
            String title,
            String content,
            String storageUri,
            String mimeType,
            String resultUrl,
            String createdAt
    ) {
    }

    public record ToolInvocationResponse(
            String toolCallId,
            String toolName,
            String toolType,
            String status,
            String requestPayload,
            String responsePayload,
            String startedAt,
            String endedAt
    ) {
    }

    public record SessionDetailResponse(
            SessionResponse session,
            List<RunResponse> runs,
            List<PlanStepResponse> planSteps,
            List<ToolInvocationResponse> toolInvocations,
            List<ArtifactResponse> artifacts,
            String summary,
            List<String> knowledgeBaseIds
    ) {
    }

    public record BindKnowledgeBasesRequest(
            List<String> knowledgeBaseIds
    ) {
        public List<String> knowledgeBaseIds() {
            return knowledgeBaseIds == null ? List.of() : knowledgeBaseIds;
        }
    }

    public record SessionKnowledgeBaseBindingResponse(
            String sessionId,
            List<String> knowledgeBaseIds
    ) {
    }

    public record EvidenceResponse(
            String citationId,
            String kbId,
            String documentId,
            String fileName,
            String chunkId,
            int chunkNo,
            int sourceOffset,
            int rank,
            String sectionTitle,
            String headingPath,
            String retrievalStrategy,
            double score,
            String contentPreview
    ) {
    }

    private List<EvidenceResponse> parseEvidenceSet(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return List.of();
        }
        try {
            List<SearchHit> hits = objectMapper.readValue(rawJson, new TypeReference<List<SearchHit>>() {
            });
            return hits.stream().map(hit -> new EvidenceResponse(
                    hit.citationId(),
                    hit.kbId(),
                    hit.documentId(),
                    hit.fileName(),
                    hit.chunkId(),
                    hit.chunkNo(),
                    hit.sourceOffset(),
                    hit.rank(),
                    hit.sectionTitle(),
                    hit.headingPath(),
                    hit.retrievalStrategy(),
                    hit.score(),
                    hit.contentPreview()
            )).toList();
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to parse retrieval evidence", exception);
        }
    }
}
