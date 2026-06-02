package com.sreehc.aiagent.trigger.session;

import com.sreehc.aiagent.application.session.SessionService;
import com.sreehc.aiagent.domain.auth.SessionUser;
import com.sreehc.aiagent.domain.session.AgentMode;
import com.sreehc.aiagent.domain.session.AgentSession;
import com.sreehc.aiagent.trigger.ApiResponse;
import com.sreehc.aiagent.trigger.AuthFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
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

    @PostMapping("/{sessionId}/runs")
    public ApiResponse<RunCreatedResponse> createRun(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable("sessionId") String sessionId,
            @Valid @RequestBody CreateRunRequest request
    ) {
        SessionService.RunCreated created = sessionService.createRun(currentUser, sessionId, new SessionService.CreateRunCommand(
                request.query(),
                request.executionMode(),
                request.knowledgeBaseIds()
        ));
        return ApiResponse.success(new RunCreatedResponse(created.runId()));
    }

    @PostMapping(
            path = "/{sessionId}/stream",
            produces = MediaType.TEXT_EVENT_STREAM_VALUE
    )
    public SseEmitter streamRun(
            @RequestAttribute(AuthFilter.CURRENT_USER_ATTRIBUTE) SessionUser currentUser,
            @PathVariable("sessionId") String sessionId,
            @Valid @RequestBody CreateRunRequest request
    ) {
        return sessionService.streamRun(currentUser, sessionId, new SessionService.CreateRunCommand(
                request.query(),
                request.executionMode(),
                request.knowledgeBaseIds()
        ));
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
                detail.runs().stream().map(run -> new RunResponse(
                        run.runCode(),
                        run.queryText(),
                        run.executionMode().name(),
                        run.status().name(),
                        run.knowledgeBaseIds(),
                        run.startedAt() == null ? null : run.startedAt().toString(),
                        run.completedAt() == null ? null : run.completedAt().toString(),
                        run.errorMessage()
                )).toList(),
                detail.planSteps().stream().map(step -> new PlanStepResponse(
                        step.stepNo(),
                        step.title(),
                        step.status().name(),
                        step.toolName(),
                        step.toolInput(),
                        step.toolOutput()
                )).toList(),
                detail.artifacts().stream().map(artifact -> new ArtifactResponse(
                        artifact.artifactCode(),
                        artifact.artifactType().name(),
                        artifact.title(),
                        artifact.content(),
                        artifact.createdAt().toString()
                )).toList(),
                detail.summary(),
                detail.knowledgeBaseIds()
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
            @NotNull AgentMode executionMode,
            List<String> knowledgeBaseIds
    ) {
        public List<String> knowledgeBaseIds() {
            return knowledgeBaseIds == null ? List.of() : knowledgeBaseIds;
        }
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

    public record RunCreatedResponse(
            String runId
    ) {
    }

    public record RunResponse(
            String runId,
            String query,
            String executionMode,
            String status,
            List<String> knowledgeBaseIds,
            String startedAt,
            String completedAt,
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
            String createdAt
    ) {
    }

    public record SessionDetailResponse(
            SessionResponse session,
            List<RunResponse> runs,
            List<PlanStepResponse> planSteps,
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
}
